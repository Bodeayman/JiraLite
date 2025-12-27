# 1. Architecture Choices

**Debugging Anecdote:**  
Early in development, the board state acted inconsistently. I realized I had been modifying state directly instead of using the `BoardProvider.jsx` reducer. Tracing dispatches taught me the importance of centralized state management. Fixing this made the board behave predictably and reinforced my architecture choices.

---

# 2. Optimistic Updates

**Debugging Anecdote:**  
The UI sometimes reverted after optimistic updates, confusing users. I traced the flow from `customDispatch` through `storage.js` and `useOfflineSync.js` and discovered `previousStateRef.current` was being cleared too early. Keeping it until sync completed solved the issue and clarified asynchronous state handling for me.

---

# 3. Conflict Resolution Approach

**Debugging Anecdote:**  
During three-way merge testing, valid changes were misidentified as conflicts. I realized the base version wasn’t stored before updates, causing `mergeItems()` to fail. Adding proper base tracking in `BoardProvider.jsx` fixed the merges and taught me the importance of version management in syncing.

---

# 4. Performance Issues Found + Solutions Implemented

**Debugging Anecdote:**  
Even with virtualization, large lists lagged. Profiling revealed unnecessary re-renders of `CardRow` and `ListColumn`. Memoizing these components fixed the lag and highlighted how subtle render issues can impact performance, reinforcing the value of careful profiling.

---

# 5. Accessibility Choices + Testing

**Debugging Anecdote:**  
Screen readers weren’t announcing modals correctly. Investigating `ConfirmDialog.jsx` showed the focus trap skipped the first element. Adjusting focus management and testing keyboard navigation solved the issue and emphasized the importance of real accessibility testing.
