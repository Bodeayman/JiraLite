import { useState, useEffect, useCallback, useRef } from 'react';
import { addToQueue, getQueue, removeFromQueue, saveList, saveCard, deleteCard, deleteList } from '../services/storage';
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
                    // Map payload to update object if needed, or assume it's correctly formatted
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
            console.error("Sync failed for op:", operation.type, error);

            // 1. Network Error -> Stop
            if (error.message === 'NETWORK_ERROR') {
                return false;
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

                    const merged = mergeItems(null, localItem, serverItem);

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
            const queue = await getQueue();
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
        // conflictId is the queue key
        // resolution: 'local' | 'server'

        // 1. Fetch the queued operation
        const queue = await getQueue();
        const entry = queue.find(q => q.key === conflictId);

        if (!entry) return; // Already gone?

        const { val: operation } = entry;

        if (resolution === 'server') {
            // "Keep Theirs": Update local DB to match server, remove from queue
            if (serverItem) {
                if (operation.type.includes('CARD')) await saveCard(serverItem);
                else if (operation.type.includes('LIST')) await saveList(serverItem);
            }
            await removeFromQueue(conflictId);
        } else {
            // "Keep Mine": Force update. Update payload version to server version so it overwrites.
            // We need to fetch current server version again? Or assume 'serverItem' passed in is fresh.
            if (serverItem) {
                const newPayload = { ...operation.payload, version: serverItem.version };
                // Update the queue item? Or just triggering processQueue will fail again if we don't update it?
                // We MUST update the stored queue item.
                // Since we don't have a specific updateQueue method, we remove and re-add? 
                // Or we can assume processQueue will pick it up if we just modify it? No, need IDB write.
                // Solution: We'll implement a fast "retry with skip" or just update storage.js to allow update.
                // For this assignment, "Keep Mine" -> Update Local DB (already done), Remove from Queue? No, we want to push to server.
                // We verify we want to OVERWRITE server.
                // We need to re-queue with updated version.
                await removeFromQueue(conflictId);
                // Re-queue with new version
                addToQueue({ ...operation, payload: newPayload });
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
