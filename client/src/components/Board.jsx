import { useState, useCallback, useMemo, Suspense } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Toolbar from './Toolbar';
import ListColumn from './ListColumn';
import ConfirmDialog from './ConfirmDialog';
import InputDialog from './InputDialog';
import LoadingFallback from './LoadingFallback';
import { useBoard } from '../context/BoardProvider';

import { useBoardState } from '../hooks/useBoardState';




import CardDetailModal from './CardDetailModal';


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



    const boardState = useBoardState();











    const [selectedCard, setSelectedCard] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [activeItem, setActiveItem] = useState(null);


    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });


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

            boardState.moveList(active.id, over.id);
        } else if (activeType === 'Card') {
            const activeColumnId = findContainer(active.id);
            const overColumnId = findContainer(over.id) || (over.data.current?.type === 'Column' ? over.id : null);

            if (activeColumnId && overColumnId) {

                boardState.moveCard(active.id, over.id, activeColumnId, overColumnId);
            }
        }

        setActiveId(null);
        setActiveItem(null);
    }, [boardState, findContainer]);

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

                boardState.deleteCard(id);
                handleCloseModal();
            }
        );
    }, [confirmAction, boardState, handleCloseModal]);

    const handleUpdateCard = useCallback((id, updates) => {

        boardState.updateCard(id, updates);
    }, [boardState]);

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

                                                boardState.addCard(column.id, title);
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

                                                boardState.editListTitle(column.id, newTitle);
                                            }
                                        }
                                    );
                                };

                                const handleArchiveList = () => {
                                    confirmAction(
                                        "Archive List",
                                        `Are you sure you want to archive "${column.title}"? This action cannot be undone.`,
                                        () => {

                                            boardState.archiveList(column.id);
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
                        activeItem && 'cards' in activeItem ? (
                            <div className="w-80 bg-slate-100 rounded-xl p-4 flex flex-col opacity-90 border-2 border-violet-500 transform rotate-2 shadow-2xl">
                                <h3 className="font-bold text-slate-700 mb-4">{activeItem.title}</h3>
                                <div className="space-y-3">
                                    <div className="h-12 bg-white rounded-lg shadow-sm"></div>
                                    <div className="h-12 bg-white rounded-lg shadow-sm"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-4 rounded-xl shadow-2xl border border-violet-500 cursor-grabbing transform rotate-2 w-[280px]">
                                <h4 className="font-medium text-slate-800">{activeItem.title}</h4>
                            </div>
                        )
                    ) : null}
                </DragOverlay>

                {selectedCard && (
                    <ErrorBoundary fallback={(error, reset) => (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-center">
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Card</h3>
                                <p className="text-slate-600 mb-6">
                                    We couldn't load the card details. This usually happens if you are offline and this part of the app hasn't been cached yet.
                                </p>
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={handleCloseModal}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={reset}
                                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}>
                        <Suspense fallback={<LoadingFallback message="Loading card details modal..." />}>
                            <CardDetailModal
                                key={selectedCard.id}
                                card={selectedCard}
                                onClose={handleCloseModal}
                                onDelete={handleDeleteCard}
                                onUpdate={handleUpdateCard}
                            />
                        </Suspense>
                    </ErrorBoundary>
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
