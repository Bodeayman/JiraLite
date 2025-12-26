# Conflict Resolution Approach

Our conflict resolution system implements a three-way merge algorithm that compares base, local, and server versions to automatically resolve conflicts when possible, falling back to manual resolution UI when conflicts cannot be auto-merged.

**Three-Way Merge Method:** The core merge logic lives in `utils/merge.js`. The `mergeItems()` function takes three parameters: `base` (original state before local changes), `local` (current offline state), and `server` (server's current state). It iterates through all fields , ignoring metadata like `version` and `lastModifiedAt` .

**Conflict Detection:** For each field, we determine if local changed from base (`localChanged`) and if server changed from base (`serverChanged`). If both changed to different values, we detect a conflict and set `hasConflict = true`. If only local changed, we keep the local value . If only server changed, we keep the server value (already in merged object).

**Base Version Tracking:** When operations are queued in `BoardProvider.jsx`, we store the base version. For example, when updating a card , we capture `baseVersion`  before making changes. This base is passed to the sync queue as `baseVersion: baseVersion`, allowing the merge function to perform proper three-way comparison.

**Auto-Merge Process:** In `useOfflineSync.js`, when a 409 conflict occurs , we extract the server item from the error response. We reconstruct the local item from the operation payload , then call `mergeItems()` with the base version . If merge succeeds , we automatically update local storage  and retry the sync with merged data.

**Manual Resolution UI:** When auto-merge fails (`merged === null`), we trigger the `onConflict` callback , which adds the conflict to state in `BoardProvider.jsx`. The `ConflictResolver.jsx` component displays side-by-side comparisons, allowing users to choose "Keep Mine" or "Keep Theirs" for each conflicting field.

**Debugging Anecdote:** Initially, conflicts weren't being detected because the base version wasn't being stored. I spent hours debugging why `mergeItems(null, local, server)` wasn't working correctly. The breakthrough came when I realized we needed to capture the state before the optimistic update. Adding `baseVersion` tracking in `BoardProvider.jsx` and passing it through the sync queue fixed the three-way merge completely.

