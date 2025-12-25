import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { List } from 'react-window';
import Card from './Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const CARD_HEIGHT = 120; // Estimated height of a card including margin (card + mb-3 margin)
const VIRTUALIZATION_THRESHOLD = 30; // Only virtualize if more than this many cards

// Render a single card row - receives index, style, and rowProps
const CardRow = memo(({ index, style, cards, onCardClick }) => {
    const card = cards[index];

    if (!card) return null;

    return (
        <div style={style}>
            <Card
                id={card.id}
                title={card.title}
                tags={card.tags}
                onClick={() => onCardClick(card)}
            />
        </div>
    );
});

CardRow.displayName = 'CardRow';

const VirtualizedCardList = memo(({ cards, onCardClick }) => {
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(600);

    // Determine if we should use virtualization
    const shouldVirtualize = cards.length > VIRTUALIZATION_THRESHOLD;

    // Get card IDs for SortableContext (all cards, not just visible ones)
    const cardIds = useMemo(() => cards.map(c => c.id), [cards]);

    // Row component for react-window
    const rowComponent = useCallback(({ index, style: rowStyle, cards: rowCards, onCardClick: rowOnCardClick }) => (
        <CardRow index={index} style={rowStyle} cards={rowCards} onCardClick={rowOnCardClick} />
    ), []);

    // Row props to pass to row component
    const rowProps = useMemo(() => ({
        cards,
        onCardClick
    }), [cards, onCardClick]);

    // Measure container height from the wrapper div
    useEffect(() => {
        if (!shouldVirtualize) return;

        const updateHeight = () => {
            if (containerRef.current) {
                const height = containerRef.current.clientHeight;
                if (height > 0) {
                    setContainerHeight(height);
                }
            }
        };

        // Initial measurement
        const timeoutId = setTimeout(updateHeight, 0);

        // Watch for resize
        const resizeObserver = new ResizeObserver(updateHeight);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [shouldVirtualize]);

    if (!shouldVirtualize) {
        // Render normally if under threshold
        return (
            <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-0">
                <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                    {cards.map((card) => (
                        <Card
                            key={card.id}
                            id={card.id}
                            title={card.title}
                            tags={card.tags}
                            onClick={() => onCardClick(card)}
                        />
                    ))}
                </SortableContext>
            </div>
        );
    }

    // Use virtualization for large lists
    return (
        <div className="flex-1 min-h-0 p-3" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
                {containerHeight > 0 && (
                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                        <List
                            rowCount={cards.length}
                            rowHeight={CARD_HEIGHT}
                            rowComponent={rowComponent}
                            rowProps={rowProps}
                            overscanCount={5}
                            style={{ height: containerHeight, width: '100%' }}
                        />
                    </SortableContext>
                )}
            </div>
        </div>
    );
});

VirtualizedCardList.displayName = 'VirtualizedCardList';

export default VirtualizedCardList;

