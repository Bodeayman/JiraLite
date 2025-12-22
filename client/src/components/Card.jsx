import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Card = ({ id, title, tags = [], onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, data: { type: 'Card', card: { id, title, tags } } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className="bg-white p-3 rounded shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition mb-3 touch-none"
        >
            <h4 className="font-medium text-gray-800 mb-2">{title}</h4>
            <div className="flex gap-1 flex-wrap overflow-hidden h-6">
                {tags.slice(0, 3).map((tag, index) => (
                    <span
                        key={index}
                        className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800"
                    >
                        {tag}
                    </span>
                ))}
                {tags.length > 3 && (
                    <span className="text-xs text-gray-500 self-center">...</span>
                )}
            </div>
        </div>
    );
};

export default Card;
