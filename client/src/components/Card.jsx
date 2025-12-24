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
            className="card-base mb-3"
        >
            <h4 className="font-medium text-slate-700 group-hover:text-violet-700 transition-colors mb-2">{title}</h4>
            <div className="flex gap-1 flex-wrap overflow-hidden min-h-[20px]">
                {tags.slice(0, 3).map((tag, index) => (
                    <span
                        key={index}
                        className="text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100"
                    >
                        {tag}
                    </span>
                ))}
                {tags.length > 3 && (
                    <span className="text-xs text-slate-400 self-center">+{tags.length - 3}</span>
                )}
            </div>
        </div>
    );
};

export default Card;
