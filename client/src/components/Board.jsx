import { useState } from 'react';
import Toolbar from './Toolbar';
import ListColumn from './ListColumn';
import CardDetailModal from './CardDetailModal';
import ConfirmDialog from './ConfirmDialog';
import InputDialog from './InputDialog';
import { useBoard } from '../context/BoardProvider';

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

    const handleCardClick = (card) => {
        setSelectedCard(card);
    };

    const handleCloseModal = () => {
        setSelectedCard(null);
    };

    // Helper to open confirm dialog
    const confirmAction = (title, message, action) => {
        setConfirmDialog({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                action();
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Helper to open input dialog
    const openInputDialog = (title, message, placeholder, initialValue, onConfirm) => {
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
    };

    const findContainer = (id) => {
        if (state.columns.find(col => col.id === id)) {
            return id;
        }
        const container = state.columns.find(col => col.cards.find(card => card.id === id));
        return container ? container.id : null;
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);

        const isColumn = active.data.current?.type === 'Column';
        if (isColumn) {
            setActiveItem(active.data.current.column);
        } else {
            setActiveItem(active.data.current.card);
        }
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        const overId = over?.id;
        if (!overId || active.id === overId) return;
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            setActiveItem(null);
            return;
        }

        const activeType = active.data.current?.type;

        if (activeType === 'Column' && active.id !== over.id) {
            dispatch({
                type: 'MOVE_LIST',
                payload: { activeId: active.id, overId: over.id }
            });
        } else if (activeType === 'Card') {
            const activeColumnId = findContainer(active.id);
            const overColumnId = findContainer(over.id) || (over.data.current?.type === 'Column' ? over.id : null);

            if (activeColumnId && overColumnId) {
                dispatch({
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
    };

    const dropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

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
                        <SortableContext items={state.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                            {state.columns.map(column => (
                                <ListColumn
                                    key={column.id}
                                    id={column.id}
                                    title={column.title}
                                    cards={column.cards}
                                    onAddCard={() => {
                                        openInputDialog(
                                            "Add New Card",
                                            "Enter a title for the new card",
                                            "Card title",
                                            "",
                                            (title) => {
                                                if (title) {
                                                    dispatch({ type: 'ADD_CARD', payload: { columnId: column.id, title } });
                                                }
                                            }
                                        );
                                    }}
                                    onEditName={() => {
                                        openInputDialog(
                                            "Edit List Title",
                                            "Enter a new title for this list",
                                            "List title",
                                            column.title,
                                            (newTitle) => {
                                                if (newTitle) {
                                                    dispatch({ type: 'EDIT_LIST_TITLE', payload: { id: column.id, title: newTitle } });
                                                }
                                            }
                                        );
                                    }}
                                    onArchiveList={() => {
                                        confirmAction(
                                            "Archive List",
                                            `Are you sure you want to archive "${column.title}"? This action cannot be undone.`,
                                            () => dispatch({ type: 'ARCHIVE_LIST', payload: column.id })
                                        );
                                    }}
                                    onCardClick={handleCardClick}
                                />
                            ))}
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
                    <CardDetailModal
                        card={selectedCard}
                        onClose={handleCloseModal}
                        onDelete={(id) => {
                            confirmAction(
                                "Delete Card",
                                "Are you sure you want to delete this card? This action cannot be undone.",
                                () => {
                                    dispatch({ type: 'DELETE_CARD', payload: id });
                                    handleCloseModal();
                                }
                            );
                        }}
                        onUpdate={(id, updates) => {
                            dispatch({ type: 'UPDATE_CARD', payload: { id, updates } });
                        }}
                    />
                )}

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                    type="danger"
                />
                <InputDialog
                    isOpen={inputDialog.isOpen}
                    title={inputDialog.title}
                    message={inputDialog.message}
                    placeholder={inputDialog.placeholder}
                    initialValue={inputDialog.initialValue}
                    onConfirm={inputDialog.onConfirm}
                    onCancel={() => setInputDialog(prev => ({ ...prev, isOpen: false }))}
                />
            </main>
        </DndContext>
    );
};

export default Board;
