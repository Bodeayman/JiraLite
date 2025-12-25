import { useState, useEffect, useCallback, useRef } from 'react';
import * as storageService from '../services/storage';
import * as apiService from '../services/api';


export const useOfflineSync = (options = {}) => {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        maxRetryDelay = 30000,
        enableServerSync = false, // Set to true if API service is implemented
        onSyncSuccess,
        onSyncError,
    } = options;

    const [syncQueue, setSyncQueue] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const retryTimeoutRef = useRef(null);
    const processingRef = useRef(false);


    const getRetryDelay = useCallback((attempt) => {
        const delay = Math.min(retryDelay * Math.pow(2, attempt), maxRetryDelay);
        return delay;
    }, [retryDelay, maxRetryDelay]);


    const persistLocally = useCallback(async (operation) => {
        try {
            switch (operation.type) {
                case 'ADD_LIST':
                case 'EDIT_LIST_TITLE':
                    if (operation.payload?.id) {
                        const list = operation.payload;
                        await storageService.saveList(list);
                    }
                    break;
                case 'ADD_CARD':
                case 'UPDATE_CARD':
                    if (operation.payload?.id) {
                        const card = operation.payload;
                        await storageService.saveCard(card);
                    }
                    break;
                case 'DELETE_CARD':
                    await storageService.deleteCard(operation.payload);
                    break;
                case 'ARCHIVE_LIST':
                    await storageService.deleteList(operation.payload);
                    break;
                case 'MOVE_LIST':
                    if (operation.payload?.lists) {
                        await storageService.updateListsOrder(operation.payload.lists);
                    }
                    break;
                case 'MOVE_CARD':
                    if (operation.payload?.cards) {
                        await storageService.updateCardsOrder(operation.payload.cards);
                    }
                    break;
                default:
                    console.warn('useOfflineSync: Unknown operation type for local persistence:', operation.type);
            }
        } catch (error) {
            console.error('useOfflineSync: Failed to persist locally:', error);
            throw error;
        }
    }, []);


    const syncWithServer = useCallback(async (operation) => {
        if (!enableServerSync || !apiService || Object.keys(apiService).length === 0) {
            return Promise.resolve();
        }

        try {
            switch (operation.type) {
                case 'ADD_LIST':
                    return await apiService.createList?.(operation.payload);
                case 'UPDATE_CARD':
                    return await apiService.updateCard?.(operation.payload.id, operation.payload.updates);
                case 'DELETE_CARD':
                    return await apiService.deleteCard?.(operation.payload);
                case 'ARCHIVE_LIST':
                    return await apiService.deleteList?.(operation.payload);
                default:
                    // For operations without specific API methods, resolve immediately
                    return Promise.resolve();
            }
        } catch (error) {
            console.error('useOfflineSync: Server sync failed:', error);
            throw error;
        }
    }, [enableServerSync]);


    const processOperation = useCallback(async (operation, attempt = 0) => {
        try {
            // Always persist locally first
            await persistLocally(operation);

            // Then sync with server if enabled
            await syncWithServer(operation);

            // Success - remove from queue
            setSyncQueue(prev => prev.filter(op => op.id !== operation.id));
            setRetryCount(0);

            if (onSyncSuccess) {
                onSyncSuccess(operation);
            }
        } catch (error) {
            // Failed - retry if attempts remaining
            if (attempt < maxRetries) {
                const delay = getRetryDelay(attempt);
                console.warn(`useOfflineSync: Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);

                retryTimeoutRef.current = setTimeout(() => {
                    processOperation(operation, attempt + 1);
                }, delay);

                setRetryCount(attempt + 1);
            } else {
                // Max retries reached - keep in queue for manual retry
                console.error('useOfflineSync: Max retries reached for operation:', operation);
                setRetryCount(0);

                if (onSyncError) {
                    onSyncError(operation, error);
                }
            }
        }
    }, [maxRetries, persistLocally, syncWithServer, getRetryDelay, onSyncSuccess, onSyncError]);

    const processQueue = useCallback(async () => {
        if (processingRef.current || syncQueue.length === 0) {
            return;
        }

        if (!isOnline && enableServerSync) {
            console.log('useOfflineSync: Offline, skipping server sync');
            // Still persist locally even when offline
            const operations = [...syncQueue];
            for (const operation of operations) {
                try {
                    await persistLocally(operation);
                    setSyncQueue(prev => prev.filter(op => op.id !== operation.id));
                } catch (error) {
                    console.error('useOfflineSync: Failed to persist locally while offline:', error);
                }
            }
            return;
        }

        processingRef.current = true;
        setIsSyncing(true);

        try {
            // Process operations sequentially to avoid conflicts
            for (const operation of [...syncQueue]) {
                await processOperation(operation);
            }
        } finally {
            processingRef.current = false;
            setIsSyncing(false);
        }
    }, [syncQueue, isOnline, enableServerSync, processOperation, persistLocally]);


    const queueOperation = useCallback((operation) => {
        if (!operation || !operation.type) {
            console.warn('useOfflineSync: Invalid operation provided');
            return;
        }

        const queuedOperation = {
            id: `${operation.type}-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            priority: operation.priority || 0,
            ...operation,
        };

        setSyncQueue(prev => {
            const updated = [...prev, queuedOperation];
            // Sort by priority (higher first), then by timestamp
            return updated.sort((a, b) => {
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.timestamp - b.timestamp;
            });
        });
    }, []);


    const clearQueue = useCallback(() => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        setSyncQueue([]);
        setRetryCount(0);
        setIsSyncing(false);
    }, []);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            processQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [processQueue]);

    // Auto-process queue when it changes and we're online
    useEffect(() => {
        if (syncQueue.length > 0 && isOnline && !processingRef.current) {
            processQueue();
        }
    }, [syncQueue.length, isOnline, processQueue]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        syncQueue,
        isOnline,
        isSyncing,
        queueOperation,
        processQueue,
        clearQueue,
        retryCount,
    };
};
