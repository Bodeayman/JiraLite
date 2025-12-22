import { useState } from 'react';
import Header from './components/Header';
import Toolbar from './components/Toolbar';
import ListColumn from './components/ListColumn';
import CardDetailModal from './components/CardDetailModal';
import { useBoard } from './context/BoardProvider';
import './styles/global.css';

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
  arrayMove
} from '@dnd-kit/sortable';
import Card from './components/Card';

function App() {
  const { state, dispatch, persistListOrder, persistCardOrder } = useBoard();
  const [selectedCard, setSelectedCard] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);

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

    const activeType = active.data.current?.type;
    const overType = over.data.current?.type;

    if (activeType === 'Card' && overType === 'Card') {

    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveItem(null);
      return;
    }

    const startContainer = active.data.current?.sortable?.containerId || findContainer(active.id); // For cards
    const endContainer = over.data.current?.sortable?.containerId || findContainer(over.id);

    const activeType = active.data.current?.type;

    if (activeType === 'Column' && active.id !== over.id) {
      // Move List
      dispatch({
        type: 'MOVE_LIST',
        payload: { activeId: active.id, overId: over.id }
      });
    } else if (activeType === 'Card') {
      // Move Card
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
      <div className="h-screen flex flex-col bg-gray-50 text-gray-800 font-sans">
        <Header />
        <main className="flex-1 flex flex-col min-h-0">
          <Toolbar />
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex gap-6 p-6 min-w-max">
              <SortableContext items={state.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                {state.columns.map(column => (
                  <ListColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    cards={column.cards}
                    onAddCard={() => {
                      const title = prompt("Enter card title:");
                      if (title) {
                        dispatch({ type: 'ADD_CARD', payload: { columnId: column.id, title } });
                      }
                    }}
                    onEditName={() => {
                      const newTitle = prompt("Enter new list title:", column.title);
                      if (newTitle) {
                        dispatch({ type: 'EDIT_LIST_TITLE', payload: { id: column.id, title: newTitle } });
                      }
                    }}
                    onArchiveList={() => {
                      if (window.confirm("Are you sure you want to archive this list?")) {
                        dispatch({ type: 'ARCHIVE_LIST', payload: column.id });
                      }
                    }}
                    onCardClick={handleCardClick}
                  />
                ))}
              </SortableContext>

              {/* Add List Placeholder */}
              <div className="w-80 flex-shrink-0">
                <button
                  onClick={() => {
                    const title = prompt("Enter list title:");
                    if (title) {
                      dispatch({ type: 'ADD_LIST', payload: title });
                    }
                  }}
                  className="w-full py-3 bg-gray-200 bg-opacity-50 hover:bg-gray-200 rounded-lg text-gray-600 font-medium text-left px-4 transition"
                >
                  + Add another list
                </button>
              </div>
            </div>
          </div>
        </main>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            activeItem && activeItem.cards ? ( // It's a column
              <div className="w-80 bg-gray-100 rounded-lg p-4 flex flex-col opacity-80 border-2 border-blue-500 transform rotate-2">
                <h3 className="font-bold text-gray-700 mb-4">{activeItem.title}</h3>
                <div className="space-y-3">
                  {activeItem.cards.slice(0, 3).map(c => (
                    <div key={c.id} className="h-12 bg-white rounded shadow-sm"></div>
                  ))}
                </div>
              </div>
            ) : ( // It's a card
              <div className="bg-white p-3 rounded shadow-lg border border-blue-500 cursor-grabbing transform rotate-2 w-[280px]">
                <h4 className="font-medium text-gray-800 mb-2">{activeItem.title}</h4>
              </div>
            )
          ) : null}
        </DragOverlay>

        {selectedCard && (
          <CardDetailModal
            card={selectedCard}
            onClose={handleCloseModal}
            onDelete={(id) => {
              if (window.confirm("Delete this card?")) {
                dispatch({ type: 'DELETE_CARD', payload: id });
                handleCloseModal();
              }
            }}
            onEdit={(card) => {
              const newTitle = prompt("Edit card title:", card.title);
              if (newTitle) {
                dispatch({ type: 'UPDATE_CARD', payload: { id: card.id, updates: { title: newTitle } } });
                handleCloseModal();
              }
            }}
          />
        )}
      </div>
    </DndContext>
  );
}

export default App;
