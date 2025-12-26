import { v4 as uuidv4 } from 'uuid';

export const initialState = {
    columns: [],
    ui: {
        selectedCardId: null,
        draggingId: null,
        activeItemType: null // 'Column' or 'Card'
    }
};

export const boardReducer = (state, action) => {
    switch (action.type) {
        case 'INIT_BOARD':
            // Merge loaded data with initial UI state (or reset UI state)
            return {
                ...state,
                columns: action.payload.columns,
                // ui: state.ui // Keep existing UI state or reset? Reset is safer on init.
            };

        case 'SET_SELECTED_CARD':
            return {
                ...state,
                ui: { ...state.ui, selectedCardId: action.payload }
            };

        case 'SET_DRAGGING_ITEM':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    draggingId: action.payload.id,
                    activeItemType: action.payload.type
                }
            };

        case 'ADD_LIST':
            const newList = {
                id: action.payload.id,
                title: action.payload.title,
                archived: false,
                order: state.columns.length,
                last_modified: Date.now(),
                lastModifiedAt: Date.now(),
                version: action.payload.version || 1,
                cards: []
            };
            return {
                ...state,
                columns: [...state.columns, newList]
            };

        case 'ADD_CARD':
            return {
                ...state,
                columns: state.columns.map(col => {
                    if (col.id === action.payload.columnId) {
                        const newCard = {
                            id: action.payload.id,
                            title: action.payload.title,
                            description: '',
                            list_id: col.id,
                            order_id: col.cards.length,
                            last_modified: Date.now(),
                            lastModifiedAt: Date.now(),
                            version: action.payload.version || 1,
                            tags: []
                        };
                        return {
                            ...col,
                            cards: [...col.cards, newCard]
                        };
                    }
                    return col;
                })
            };

        case 'DELETE_CARD':
            return {
                ...state,
                columns: state.columns.map(col => ({
                    ...col,
                    cards: col.cards.filter(card => card.id !== action.payload)
                }))
            };

        case 'UPDATE_CARD':
            return {
                ...state,
                columns: state.columns.map(col => ({
                    ...col,
                    cards: col.cards.map(card =>
                        card.id === action.payload.id
                            ? { 
                                ...card, 
                                ...action.payload.updates, 
                                last_modified: Date.now(),
                                lastModifiedAt: Date.now(),
                                version: action.payload.updates.version || card.version
                            }
                            : card
                    )
                }))
            };

        case 'EDIT_LIST_TITLE':
            return {
                ...state,
                columns: state.columns.map(col =>
                    col.id === action.payload.id 
                        ? { 
                            ...col, 
                            title: action.payload.title, 
                            last_modified: Date.now(),
                            lastModifiedAt: Date.now(),
                            version: action.payload.version || col.version
                        } 
                        : col
                )
            };

        case 'ARCHIVE_LIST':
            return {
                ...state,
                columns: state.columns.filter(col => col.id !== action.payload)
            };

        case 'MOVE_LIST': {
            const { activeId, overId } = action.payload;
            const oldIndex = state.columns.findIndex(col => col.id === activeId);
            const newIndex = state.columns.findIndex(col => col.id === overId);

            if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return state;

            const newColumns = [...state.columns];
            const [movedColumn] = newColumns.splice(oldIndex, 1);
            newColumns.splice(newIndex, 0, movedColumn);

            // Update order property
            return {
                ...state,
                columns: newColumns.map((col, index) => ({ ...col, order: index }))
            };
        }

        case 'MOVE_CARD': {
            const { activeId, overId, activeColumnId, overColumnId } = action.payload;

            // Find positions in the original state to check validity
            const sourceColIndex = state.columns.findIndex(col => col.id === activeColumnId);
            const destColIndex = state.columns.findIndex(col => col.id === overColumnId);

            if (sourceColIndex === -1 || destColIndex === -1) return state;

            // Create new columns array
            const newColumns = [...state.columns];

            // Create new source column object
            const sourceCol = { ...newColumns[sourceColIndex], cards: [...newColumns[sourceColIndex].cards] };

            // Identify active card
            const activeCardIndex = sourceCol.cards.findIndex(c => c.id === activeId);
            if (activeCardIndex === -1) return state;

            const activeCard = sourceCol.cards[activeCardIndex];

            // Remove from source
            sourceCol.cards.splice(activeCardIndex, 1);

            // Update source column in newColumns
            newColumns[sourceColIndex] = sourceCol;

            // Determine destination column
            // If source and dest are same, we use the already modified sourceCol as the base for destination operations
            // otherwise we clone the destination column
            let destCol;
            if (sourceColIndex === destColIndex) {
                destCol = sourceCol;
            } else {
                destCol = { ...newColumns[destColIndex], cards: [...newColumns[destColIndex].cards] };
                newColumns[destColIndex] = destCol; // Update dest column in newColumns
            }

            // Calculate insertion index
            let overCardIndex = -1;
            if (overId) {
                overCardIndex = destCol.cards.findIndex(c => c.id === overId);
            }

            const newIndex = overCardIndex >= 0 ? overCardIndex : destCol.cards.length;

            // Create updated card with new list_id
            const updatedCard = {
                ...activeCard,
                list_id: overColumnId,
                last_modified: Date.now()
            };

            // Insert into destination
            destCol.cards.splice(newIndex, 0, updatedCard);

            // Reassign order_id for all cards in affected columns using map for immutability
            destCol.cards = destCol.cards.map((c, i) => ({ ...c, order_id: i }));

            if (sourceColIndex !== destColIndex) {
                sourceCol.cards = sourceCol.cards.map((c, i) => ({ ...c, order_id: i }));
            }

            return {
                ...state,
                columns: newColumns
            };
        }

        case 'REVERT_OPTIMISTIC_UPDATE':
            // Revert to previous state on sync failure
            return action.payload.previousState;

        default:
            return state;
    }
};
