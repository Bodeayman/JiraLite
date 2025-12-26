# Optimistic Updates

Optimistic updates provide instant user feedback by updating the UI immediately, then syncing with the server in the background. Our implementation ensures data integrity through automatic revert mechanisms when sync fails.

**Sequence of Events:** When a user adds a card, the flow begins in `BoardProvider.jsx` at . First, we capture the previous state snapshot  using `JSON.parse(JSON.stringify(state))` stored in `previousStateRef.current`. The optimistic UI update happens immediately via `dispatch(finalAction)` , rendering the new card instantly.

**Local Persistence:** After the UI update, we persist to IndexedDB through `saveCard()` in `storage.js` . This ensures data survives browser restarts even if sync fails. The operation is then queued for server sync via `scheduleSync()`, which adds it to the IndexedDB queue store.

**Server Sync:** The `useOfflineSync.js` hook processes queued operations in `processOperation()` . When online, it attempts to sync with the server using `apiClient.createCard()`. On success, the operation is removed from the queue.

**Failure Handling:** If sync fails (network error or server error), the error handler checks the error type. For non-network errors, we revert the optimistic update by dispatching `REVERT_OPTIMISTIC_UPDATE` action, which restores the previous state from `previousStateRef.current`. The `boardReducer.js` handles this, returning the previous state snapshot.

**Error Display:** Failed syncs trigger `onSyncError` callback (`BoardProvider.jsx`), which adds error notifications to `syncErrors` state. The `SyncErrorNotification.jsx` component displays these errors to users, auto-dismissing after 5 seconds.

**Debugging Anecdote:** During development, I discovered that reverting state wasn't working because `previousStateRef.current` was being cleared too early. The issue was where we cleared it immediately after local save, but sync failures occurred later. Moving the clear to only happen after successful sync (or keeping it until sync completes) fixed the revert mechanism.

