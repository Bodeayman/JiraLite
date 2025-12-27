import { memo, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Card = memo(({ id, title, tags = [], onClick }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: id, data: { type: 'Card', card: { id, title, tags } } });

    const style = useMemo(() => ({
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    }), [transform, transition, isDragging]);

    const visibleTags = useMemo(() => tags.slice(0, 3), [tags]);
    const remainingTagsCount = useMemo(() => tags.length - 3, [tags.length]);

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}

            role="button"
            tabIndex={0}
            onClick={onClick}
            className="card-base mb-3"
        >
            <h4 className="font-medium text-slate-700 group-hover:text-violet-700 transition-colors mb-2">{title}</h4>
            <div className="flex gap-1 flex-wrap overflow-hidden min-h-[20px]">
                {visibleTags.map((tag, index) => (
                    <span
                        key={`${tag}-${index}`}
                        className="text-[10px] uppercase font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100"
                    >
                        {tag}
                    </span>
                ))}
                {remainingTagsCount > 0 && (
                    <span className="text-xs text-slate-400 self-center">+{remainingTagsCount}</span>
                )}
            </div>
        </div>
    );
});

Card.displayName = 'Card';

export default Card;
