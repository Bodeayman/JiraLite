import Card from './Card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const ListColumn = ({ id, title, cards = [], onAddCard, onEditName, onArchiveList, onCardClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: id,
        data: { type: 'Column', column: { id, title } }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-80 flex-shrink-0 bg-gray-100 rounded-lg p-4 flex flex-col max-h-full touch-none"
        >
            <div
                {...attributes}
                {...listeners}
                className="flex justify-between items-center mb-4 cursor-grab active:cursor-grabbing"
            >
                <h3 className="font-bold text-gray-700">{title}</h3>
                <div className="relative group">
                    <button className="text-gray-500 hover:text-gray-700 p-1 font-bold">
                        ...
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg hidden group-hover:block z-10" onPointerDown={e => e.stopPropagation()}>
                        <button onClick={onAddCard} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add Card</button>
                        <button onClick={onEditName} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit Name</button>
                        <button onClick={onArchiveList} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Archive List</button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            tags={card.tags}
                            onClick={(e) => {
                                onCardClick(card);
                            }}
                        />
                    ))}
                </SortableContext>
            </div>

            <button
                onClick={onAddCard}
                className="mt-3 text-gray-500 hover:text-gray-800 text-sm flex items-center font-medium"
            >
                + Add a card
            </button>
        </div>
    );
};

export default ListColumn;
