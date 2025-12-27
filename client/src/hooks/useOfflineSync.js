import { useState, useEffect, useCallback, useRef } from 'react';
import { addToQueue, getQueue, removeFromQueue, saveList, saveCard } from '../services/storage';
import { apiClient } from '../services/apiClient';
import { mergeItems } from '../utils/merge';

export const useOfflineSync = (options = {}) => {
    const { onSyncError, onConflict, syncInterval } = options;
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const processingRef = useRef(false);

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
    }, [syncInterval]);

    const processOperation = async (entry) => {
        const { key, val: operation } = entry;

        // Initialize retry counter
        operation._retryCount = operation._retryCount || 0;

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

            await removeFromQueue(key);
            return true;

        } catch (error) {
            if (error.message === 'NETWORK_ERROR' || error.isOffline) {
                return false;
            }

            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
                console.error("Sync failed for op:", operation.type, error);
            }

            // Conflict handling
            if (error.status === 409 || (error.message && error.message.includes('Conflict'))) {
                const serverItem = error.serverItem;

                if (serverItem) {
                    let localItem = operation.type.includes('CARD')
                        ? { ...operation.payload, ...operation.payload.updates }
                        : { ...operation.payload };

                    const baseVersion = operation.baseVersion || null;
                    const merged = mergeItems(baseVersion, localItem, serverItem);

                    if (merged) {
                        console.log("Auto-merged conflict for", operation.type);

                        // Limit retries to 1
                        if (operation._retryCount >= 1) {
                            console.warn("Conflict could not be resolved automatically, manual resolution required");
                            if (onConflict) {
                                onConflict({
                                    id: key,
                                    operation,
                                    local: localItem,
                                    server: serverItem
                                });
                            }
                            return false;
                        }

                        const newPayload = { ...operation.payload, ...merged, version: serverItem.version };

                        if (operation.type.includes('CARD')) await saveCard(merged);
                        else if (operation.type.includes('LIST')) await saveList(merged);

                        operation.payload = newPayload;
                        operation._retryCount += 1;

                        // Retry once safely
                        return await processOperation({ key, val: operation });
                    } else {
                        if (onConflict) {
                            onConflict({
                                id: key,
                                operation,
                                local: localItem,
                                server: serverItem
                            });
                        }
                        return false;
                    }
                }
            }

            await removeFromQueue(key);
            if (onSyncError) onSyncError(error, operation);
            return true;
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
    }, [processQueue]);

    const resolveConflict = useCallback(async (conflictId, resolution, serverItem) => {
        console.log(`Resolving conflict ${conflictId} with ${resolution}`, serverItem);

        const queue = await getQueue();
        const entry = queue.find(q => q.key == conflictId);
        if (!entry) {
            console.warn(`Conflict item ${conflictId} not found in queue.`);
            return;
        }

        const { val: operation } = entry;

        if (resolution === 'server') {
            if (serverItem) {
                if (operation.type.includes('CARD')) await saveCard(serverItem);
                else await saveList(serverItem);
            }
            await removeFromQueue(conflictId);
        } else {
            if (serverItem) {
                const newPayload = { ...operation.payload };
                if (newPayload.updates) newPayload.updates.version = serverItem.version;
                else newPayload.version = serverItem.version;

                await removeFromQueue(conflictId);
                await addToQueue({ ...operation, payload: newPayload });
            }
        }

        processQueue();
    }, [processQueue]);

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
