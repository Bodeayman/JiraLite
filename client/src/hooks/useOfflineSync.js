import { useState, useEffect, useCallback, useRef } from 'react';
import { addToQueue, getQueue, removeFromQueue, saveList, saveCard } from '../services/storage';
import { apiClient } from '../services/apiClient';
import { mergeItems } from '../utils/merge';

export const useOfflineSync = (options = {}) => {
    const { onSyncError, onConflict, syncInterval } = options;
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const processingRef = useRef(false);

    // Initial load and Periodic Sync
    useEffect(() => {
        const checkQueue = async () => {
            if (navigator.onLine) {
                processQueue();
            }
        };
        checkQueue();

        let interval;
        if (syncInterval) {
            interval = setInterval(checkQueue, syncInterval);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncInterval]);

    const processOperation = async (entry) => {
        const { key, val: operation } = entry;

        try {
            switch (operation.type) {
                case 'ADD_LIST':
                    await apiClient.createList(operation.payload);
                    break;
                case 'UPDATE_LIST':
                case 'EDIT_LIST_TITLE':
                    await apiClient.updateList(operation.payload.id, { title: operation.payload.title, version: operation.payload.version });
                    break;
                case 'DELETE_LIST':
                case 'ARCHIVE_LIST':
                    await apiClient.deleteList(operation.payload);
                    break;
                case 'ADD_CARD':
                    await apiClient.createCard(operation.payload);
                    break;
                case 'UPDATE_CARD':
                    await apiClient.updateCard(operation.payload.id, operation.payload.updates);
                    break;
                case 'DELETE_CARD':
                    await apiClient.deleteCard(operation.payload);
                    break;
                case 'MOVE_LIST':
                    if (operation.payload.lists) {
                        await apiClient.reorder({ lists: operation.payload.lists });
                    }
                    break;
                case 'MOVE_CARD':
                    if (operation.payload.cards) {
                        await apiClient.reorder({ cards: operation.payload.cards });
                    }
                    break;
            }

            // Success
            await removeFromQueue(key);
            return true; // Continue processing

        } catch (error) {
            // 1. Network Error -> Stop silently (app works offline)
            if (error.message === 'NETWORK_ERROR' || error.isOffline) {
                // Silently fail - app works completely offline with local data
                return false;
            }

            // Only log non-network errors
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                console.error("Sync failed for op:", operation.type, error);
            }

            // 2. Conflict (409) -> Auto-Merge or Pause for User
            if (error.status === 409 || (error.message && error.message.includes('Conflict'))) {
                const serverItem = error.serverItem; // Assuming api client throws this formatted error
                // We need to parse the response body from the error if apiClient supports it.
                // NOTE: apiClient needs to throw an error object containing the response data for this to work.

                if (serverItem) {
                    // Try Auto-Merge
                    // We don't have 'base', just local (operation payload) and server.
                    // Construct 'local' object from operation payload primarily.
                    let localItem = {};
                    if (operation.type.includes('CARD')) {
                        // Reconstruct card-like object for merging
                        localItem = { ...operation.payload, ...operation.payload.updates };
                    } else {
                        localItem = { ...operation.payload };
                    }

                    // Use baseVersion from operation for proper three-way merge
                    const baseVersion = operation.baseVersion || null;
                    const merged = mergeItems(baseVersion, localItem, serverItem);

                    if (merged) {
                        console.log("Auto-merged conflict for", operation.type);
                        // Update queue item with merged data and server version
                        const newPayload = { ...operation.payload, ...merged, version: serverItem.version }; // Use server version to overwrite

                        // We need to update the LOCAL STORE (Cards/Lists) to reflect the merged state immediately?
                        // Yes, otherwise UI is stale.
                        if (operation.type.includes('CARD')) await saveCard(merged);
                        else if (operation.type.includes('LIST')) await saveList(merged);

                        // Update Op in Queue (Modify 'val' and put back?)
                        // Simplification: We retry immediately with new payload? 
                        // Better: Recurse? Or just return true to skip removing (wait, no, we need to remove old and add new?)
                        // Let's just update the in-memory operation and recurse once?
                        operation.payload = newPayload;
                        return await processOperation({ key, val: operation });
                    } else {
                        // Manual Resolution Required
                        if (onConflict) {
                            onConflict({
                                id: key, // Use queue key as conflict ID
                                operation: operation,
                                local: localItem,
                                server: serverItem
                            });
                        }
                        return false; // Stop queue processing
                    }
                }
            }

            // 3. Other Server Error -> Remove & Notify
            await removeFromQueue(key);
            if (onSyncError) {
                onSyncError(error, operation);
            }
            return true; // Continue (skip this bad one)
        }
    };

    const processQueue = useCallback(async () => {
        if (processingRef.current || !navigator.onLine) return;

        processingRef.current = true;
        setIsSyncing(true);

        try {
            const queueResponse = await getQueue();
            const queue = Array.isArray(queueResponse) ? queueResponse : [];
            for (const entry of queue) {
                const success = await processOperation(entry);
                if (!success) break;
            }
        } finally {
            processingRef.current = false;
            setIsSyncing(false);
        }
    }, [onSyncError, onConflict]);

    const scheduleSync = useCallback((action) => {
        addToQueue(action).then(() => {
            if (navigator.onLine) {
                processQueue();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processQueue]);

    const resolveConflict = useCallback(async (conflictId, resolution, serverItem) => {
        console.log(`Resolving conflict ${conflictId} with ${resolution}`, serverItem);

        const queue = await getQueue();
        // Use loose equality and handle potential string/number mismatch for conflictId
        const entry = queue.find(q => q.key == conflictId);

        if (!entry) {
            console.warn(`Conflict item ${conflictId} not found in queue.`);
            return;
        }

        const { val: operation } = entry;
        console.log(`Found operation in queue: ${operation.type}`);

        if (resolution === 'server') {
            // "Keep Theirs": Update local DB to match server, remove from queue
            if (serverItem) {
                if (operation.type.includes('CARD')) await saveCard(serverItem);
                else if (operation.type.includes('LIST')) await saveList(serverItem);
            }
            await removeFromQueue(conflictId);
        } else {
            // "Keep Mine": Force update by using the server's current version
            if (serverItem) {
                const newPayload = { ...operation.payload };

                // Handle different payload structures
                if (newPayload.updates) {
                    // It's a card update
                    newPayload.updates.version = serverItem.version;
                } else {
                    // It's a list title update or other direct payload
                    newPayload.version = serverItem.version;
                }

                await removeFromQueue(conflictId);
                // Re-queue with new version so the next sync attempt succeeds
                await addToQueue({ ...operation, payload: newPayload });
            }
        }

        // Resume sync
        processQueue();
    }, [processQueue]);

    // Listen for Online status
    useEffect(() => {
        const handleOnline = () => { setIsOnline(true); processQueue(); };
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [processQueue]);

    return {
        scheduleSync,
        resolveConflict,
        isOnline,
        isSyncing
    };
};
