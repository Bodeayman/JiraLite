import { memo, useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { List } from 'react-window';
import Card from './Card';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const CARD_HEIGHT = 120;
const VIRTUALIZATION_THRESHOLD = 30;

// Render a single card row
const CardRow = memo(({ index, style, cards, onCardClick }) => {
    const card = cards[index];

    if (!card) return null;

    return (
        <div
            style={style}
            role="listitem"
        >
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

const VirtualizedCardList = memo(({ cards, onCardClick, listTitle = 'Cards' }) => {
    const containerRef = useRef(null);
    const [containerHeight, setContainerHeight] = useState(600);
    const [announcement, setAnnouncement] = useState('');
    const previousCardCount = useRef(cards.length);

    const shouldVirtualize = cards.length > VIRTUALIZATION_THRESHOLD;
    const cardIds = useMemo(() => cards.map(c => c.id), [cards]);

    /* =========================
       Announce card count changes to screen readers
    ========================= */
    useEffect(() => {
        const currentCount = cards.length;
        const previousCount = previousCardCount.current;

        if (currentCount !== previousCount) {
            if (currentCount > previousCount) {
                setAnnouncement(`Card added. ${currentCount} cards total.`);
            } else if (currentCount < previousCount) {
                setAnnouncement(`Card removed. ${currentCount} cards total.`);
            }
            previousCardCount.current = currentCount;

            // Clear announcement after screen reader reads it
            const timer = setTimeout(() => setAnnouncement(''), 1000);
            return () => clearTimeout(timer);
        }
    }, [cards.length]);

    const rowComponent = useCallback(({ index, style: rowStyle }) => (
        <CardRow
            index={index}
            style={rowStyle}
            cards={cards}
            onCardClick={onCardClick}
        />
    ), [cards, onCardClick]);

    /* =========================
       Measure container height for virtualization
    ========================= */
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

        const timeoutId = setTimeout(updateHeight, 0);
        const resizeObserver = new ResizeObserver(updateHeight);

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timeoutId);
            resizeObserver.disconnect();
        };
    }, [shouldVirtualize]);

    // Non-virtualized list (under threshold)
    if (!shouldVirtualize) {
        return (
            <>
                {/* Screen reader announcements */}
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    {announcement}
                </div>

                <div
                    className="flex-1 overflow-y-auto min-h-0 p-3 space-y-0"
                    role="list"
                    aria-label={`${listTitle} list with ${cards.length} ${cards.length === 1 ? 'card' : 'cards'}`}
                >
                    <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                        {cards.length === 0 ? (
                            <div
                                className="text-center py-8 text-slate-400"
                                role="status"
                            >
                                No cards yet
                            </div>
                        ) : (
                            cards.map((card, index) => (
                                <div
                                    key={card.id}
                                    role="listitem"
                                    aria-posinset={index + 1}
                                    aria-setsize={cards.length}
                                >
                                    <Card
                                        id={card.id}
                                        title={card.title}
                                        tags={card.tags}
                                        onClick={() => onCardClick(card)}
                                    />
                                </div>
                            ))
                        )}
                    </SortableContext>
                </div>
            </>
        );
    }

    // Virtualized list (over threshold)
    return (
        <>
            {/* Screen reader announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {announcement}
            </div>

            <div
                className="flex-1 min-h-0 p-3"
                style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                <div
                    ref={containerRef}
                    style={{ flex: 1, minHeight: 0 }}
                    role="list"
                    aria-label={`${listTitle} list with ${cards.length} cards (virtualized view)`}
                    aria-describedby="virtualized-list-description"
                >
                    {/* Hidden description for screen readers */}
                    <div id="virtualized-list-description" className="sr-only">
                        This list is virtualized for performance. Not all cards may be visible in the accessibility tree at once. Use arrow keys to navigate through cards.
                    </div>

                    {containerHeight > 0 && (
                        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
                            {cards.length === 0 ? (
                                <div
                                    className="text-center py-8 text-slate-400"
                                    role="status"
                                >
                                    No cards yet
                                </div>
                            ) : (
                                <List
                                    height={containerHeight}
                                    itemCount={cards.length}
                                    itemSize={CARD_HEIGHT}
                                    width="100%"
                                    overscanCount={5}
                                    itemData={{ cards, onCardClick }}
                                >
                                    {rowComponent}
                                </List>
                            )}
                        </SortableContext>
                    )}
                </div>
            </div>
        </>
    );
});

VirtualizedCardList.displayName = 'VirtualizedCardList';

export default VirtualizedCardList;