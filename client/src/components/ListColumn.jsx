import { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import Card from './Card';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import VirtualizedCardList from './VirtualizedCardList';

const ListColumn = memo(({ id, title, cards = [], onAddCard, onEditName, onArchiveList, onCardClick }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: id,
        data: { type: 'Column', column: { id, title, cards } }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target) &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isMenuOpen]);

    const handleMenuToggle = useCallback((e) => {
        e.stopPropagation();
        setIsMenuOpen(prev => !prev);
    }, []);

    const handleMenuAction = useCallback((action) => {
        return (e) => {
            e.stopPropagation();
            setIsMenuOpen(false);
            action();
        };
    }, []);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-80 flex-shrink-0 bg-slate-100/80 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm flex flex-col max-h-full"
        >
            <div
                {...attributes}
                {...listeners}
                className="p-4 cursor-grab active:cursor-grabbing flex justify-between items-center bg-white/40 rounded-t-xl border-b border-white/50"
            >
                <h3 className="font-bold text-slate-700">{title}</h3>
                <div className="relative">
                    <button
                        ref={buttonRef}
                        onClick={handleMenuToggle}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white/60 transition-all"
                        onPointerDown={e => e.stopPropagation()}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                            <circle cx="8" cy="3" r="1.5" />
                            <circle cx="8" cy="8" r="1.5" />
                            <circle cx="8" cy="13" r="1.5" />
                        </svg>
                    </button>
                    {isMenuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <button
                                onClick={handleMenuAction(onAddCard)}
                                className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Add Card
                                </span>
                            </button>
                            <button
                                onClick={handleMenuAction(onEditName)}
                                className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors border-t border-slate-100"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                                    Edit Name
                                </span>
                            </button>
                            <button
                                onClick={handleMenuAction(onArchiveList)}
                                className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-100"
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
                                    Archive List
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <VirtualizedCardList
                cards={cards}
                onCardClick={onCardClick}
            />
        </div>
    );
});

ListColumn.displayName = 'ListColumn';

export default ListColumn;
