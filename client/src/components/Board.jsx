import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import Toolbar from './Toolbar';
import ListColumn from './ListColumn';
import ConfirmDialog from './ConfirmDialog';
import InputDialog from './InputDialog';
import LoadingFallback from './LoadingFallback';
import { useBoard } from '../context/BoardProvider';
// Import custom hooks for better code organization and functionality
import { useBoardState } from '../hooks/useBoardState';
import { useOfflineSync } from '../hooks/useOfflineSync';
// Note: useUndoRedo is available but requires state management refactoring to integrate fully
// import { useUndoRedo } from '../hooks/useUndoRedo';

// Lazy-load the heavy CardDetailModal component for code splitting
// Add artificial delay to simulate slow network (for demonstration purposes)
// Set SIMULATE_SLOW_LOADING to true to see the Suspense fallback
const SIMULATE_SLOW_LOADING = true; // Change to false to disable simulation
const DELAY_MS = 1000; // 1 seconds delay
// Lazy loading for the component don't need it right now
const CardDetailModal = lazy(() => {
    const importPromise = import('./CardDetailModal');

    if (SIMULATE_SLOW_LOADING) {
        // Add artificial delay to simulate slow network
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(importPromise);
            }, DELAY_MS);
        });
    }

    return importPromise;
});

import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

const Board = () => {
    const { state, dispatch } = useBoard();

    // Use useBoardState hook for cleaner, more maintainable board operations
    // This hook wraps reducer actions and provides convenient methods instead of raw dispatch calls
    // Why it wasn't used before: The hook file existed but was empty (just a stub)
    const boardState = useBoardState();

    // Use useOfflineSync for handling persistence, sync queue, and retry logic
    // This hook manages offline synchronization and ensures operations are persisted
    // Why it wasn't used before: The hook file existed but was empty (just a stub)
    const { queueOperation, isSyncing, syncQueue } = useOfflineSync({
        enableServerSync: false, // Set to true when API service is implemented
        onSyncSuccess: (operation) => {
            console.log('Operation synced successfully:', operation.type);
        },
        onSyncError: (operation, error) => {
            console.error('Sync failed for operation:', operation.type, error);
        },
    });

    // Note: useUndoRedo hook is available but would require refactoring the state management
    // to track state changes. Currently, BoardProvider handles state via reducer.
    // To integrate undo/redo, you would need to:
    // 1. Capture state snapshots before each operation
    // 2. Store them in the undo/redo stack
    // 3. Provide UI controls (keyboard shortcuts, buttons) to trigger undo/redo
    // Example integration would look like:
    // const undoRedo = useUndoRedo(state, 50);
    // Then wrap state updates: undoRedo.setState(newState);

    const [selectedCard, setSelectedCard] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);

    // Dialog State
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Input Dialog State
    const [inputDialog, setInputDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        placeholder: '',
        initialValue: '',
        onConfirm: () => { },
    });

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCardClick = useCallback((card) => {
        setSelectedCard(card);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedCard(null);
    }, []);

    // Helper to open confirm dialog
    const confirmAction = useCallback((title, message, action) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                action();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, []);

    // Helper to open input dialog
    const openInputDialog = useCallback((title, message, placeholder, initialValue, onConfirm) => {
        setInputDialog({
            isOpen: true,
            title,
            message,
            placeholder,
            initialValue: initialValue || '',
            onConfirm: (value) => {
                onConfirm(value);
                setInputDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    }, []);

    const findContainer = useCallback((id) => {
        if (state.columns.find(col => col.id === id)) {
            return id;
        }
        const container = state.columns.find(col => col.cards.find(card => card.id === id));
        return container ? container.id : null;
    }, [state.columns]);

    const handleDragStart = useCallback((event) => {
        const { active } = event;
        setActiveId(active.id);

        const isColumn = active.data.current?.type === 'Column';
        if (isColumn) {
            setActiveItem(active.data.current.column);
        } else {
            setActiveItem(active.data.current.card);
        }
    }, []);

    const handleDragOver = useCallback((event) => {
        const { active, over } = event;
        const overId = over?.id;
        if (!overId || active.id === overId) return;
    }, []);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            setActiveItem(null);
            return;
        }

        const activeType = active.data.current?.type;

        if (activeType === 'Column' && active.id !== over.id) {
            // Using useBoardState hook for cleaner API
            boardState.moveList(active.id, over.id);
            // Also queue for offline sync
            queueOperation({
                type: 'MOVE_LIST',
                payload: { activeId: active.id, overId: over.id }
            });
        } else if (activeType === 'Card') {
            const activeColumnId = findContainer(active.id);
            const overColumnId = findContainer(over.id) || (over.data.current?.type === 'Column' ? over.id : null);

            if (activeColumnId && overColumnId) {
                // Using useBoardState hook for cleaner API
                boardState.moveCard(active.id, over.id, activeColumnId, overColumnId);
                // Also queue for offline sync
                queueOperation({
                    type: 'MOVE_CARD',
                    payload: {
                        activeId: active.id,
                        overId: over.id,
                        activeColumnId: activeColumnId,
                        overColumnId: overColumnId
                    }
                });
            }
        }

        setActiveId(null);
        setActiveItem(null);
    }, [boardState, queueOperation, findContainer]);

    const dropAnimation = useMemo(() => ({
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    }), []);

    const handleDeleteCard = useCallback((id) => {
        confirmAction(
            "Delete Card",
            "Are you sure you want to delete this card? This action cannot be undone.",
            () => {
                // Using useBoardState hook for cleaner API
                boardState.deleteCard(id);
                // Also queue for offline sync (though BoardProvider already handles persistence)
                queueOperation({ type: 'DELETE_CARD', payload: id });
                handleCloseModal();
            }
        );
    }, [confirmAction, boardState, queueOperation, handleCloseModal]);

    const handleUpdateCard = useCallback((id, updates) => {
        // Using useBoardState hook for cleaner API instead of raw dispatch
        boardState.updateCard(id, updates);
        // Also queue for offline sync
        queueOperation({
            type: 'UPDATE_CARD',
            payload: { id, updates }
        });
    }, [boardState, queueOperation]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <main className="flex-1 flex flex-col min-h-0 relative">
                <Toolbar />
                <div className="flex-1 overflow-x-auto overflow-y-hidden">
                    <div className="h-full flex gap-6 p-6 min-w-max items-start">
                        <SortableContext items={useMemo(() => state.columns.map(c => c.id), [state.columns])} strategy={horizontalListSortingStrategy}>
                            {state.columns.map(column => {
                                const handleAddCard = () => {
                                    openInputDialog(
                                        "Add New Card",
                                        "Enter a title for the new card",
                                        "Card title",
                                        "",
                                        (title) => {
                                            if (title) {
                                                // Using useBoardState hook for cleaner API
                                                const cardId = boardState.addCard(column.id, title);
                                                // Also queue for offline sync
                                                if (cardId) {
                                                    queueOperation({
                                                        type: 'ADD_CARD',
                                                        payload: { id: cardId, columnId: column.id, title }
                                                    });
                                                }
                                            }
                                        }
                                    );
                                };

                                const handleEditName = () => {
                                    openInputDialog(
                                        "Edit List Title",
                                        "Enter a new title for this list",
                                        "List title",
                                        column.title,
                                        (newTitle) => {
                                            if (newTitle) {
                                                // Using useBoardState hook for cleaner API
                                                boardState.editListTitle(column.id, newTitle);
                                                // Also queue for offline sync
                                                queueOperation({
                                                    type: 'EDIT_LIST_TITLE',
                                                    payload: { id: column.id, title: newTitle }
                                                });
                                            }
                                        }
                                    );
                                };

                                const handleArchiveList = () => {
                                    confirmAction(
                                        "Archive List",
                                        `Are you sure you want to archive "${column.title}"? This action cannot be undone.`,
                                        () => {
                                            // Using useBoardState hook for cleaner API
                                            boardState.archiveList(column.id);
                                            // Also queue for offline sync
                                            queueOperation({
                                                type: 'ARCHIVE_LIST',
                                                payload: column.id
                                            });
                                        }
                                    );
                                };

                                return (
                                    <ListColumn
                                        key={column.id}
                                        id={column.id}
                                        title={column.title}
                                        cards={column.cards}
                                        onAddCard={handleAddCard}
                                        onEditName={handleEditName}
                                        onArchiveList={handleArchiveList}
                                        onCardClick={handleCardClick}
                                    />
                                );
                            })}
                        </SortableContext>
                    </div>
                </div>

                <DragOverlay dropAnimation={dropAnimation}>
                    {activeId ? (
                        activeItem && 'cards' in activeItem ? ( // It's a column
                            <div className="w-80 bg-slate-100 rounded-xl p-4 flex flex-col opacity-90 border-2 border-violet-500 transform rotate-2 shadow-2xl">
                                <h3 className="font-bold text-slate-700 mb-4">{activeItem.title}</h3>
                                <div className="space-y-3">
                                    <div className="h-12 bg-white rounded-lg shadow-sm"></div>
                                    <div className="h-12 bg-white rounded-lg shadow-sm"></div>
                                </div>
                            </div>
                        ) : ( // It's a card
                            <div className="bg-white p-4 rounded-xl shadow-2xl border border-violet-500 cursor-grabbing transform rotate-2 w-[280px]">
                                <h4 className="font-medium text-slate-800">{activeItem.title}</h4>
                            </div>
                        )
                    ) : null}
                </DragOverlay>

                {selectedCard && (
                    <Suspense fallback={<LoadingFallback message="Loading card details modal..." />}>
                        <CardDetailModal
                            card={selectedCard}
                            onClose={handleCloseModal}
                            onDelete={handleDeleteCard}
                            onUpdate={handleUpdateCard}
                        />
                    </Suspense>
                )}

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={useCallback(() => setConfirmDialog(prev => ({ ...prev, isOpen: false })), [])}
                    type="danger"
                />
                <InputDialog
                    isOpen={inputDialog.isOpen}
                    title={inputDialog.title}
                    message={inputDialog.message}
                    placeholder={inputDialog.placeholder}
                    initialValue={inputDialog.initialValue}
                    onConfirm={inputDialog.onConfirm}
                    onCancel={useCallback(() => setInputDialog(prev => ({ ...prev, isOpen: false })), [])}
                />
            </main>
        </DndContext>
    );
};

export default Board;
