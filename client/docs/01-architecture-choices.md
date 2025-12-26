# Architecture Choices

Our application follows a centralized state management architecture using React Context API with useReducer, ensuring predictable data flow and maintainability. The system is organized into distinct layers: presentation components, state management, data persistence, and synchronization.

**Component Hierarchy:** The root `App.jsx` wraps the entire application with `BoardProvider`, which manages global state. `Board.jsx`  serves as the main container, orchestrating drag-and-drop interactions and rendering `ListColumn` components. Each `ListColumn`  contains a `VirtualizedCardList` for performance optimization, which conditionally renders cards based on list size.

**State Ownership:** All board data lives in a single source of truth managed by `BoardProvider.jsx` . The `boardReducer.js`  handles all state mutations through pure functions, ensuring no direct state manipulation. Local component state (like dialog visibility in `Board.jsx`) is limited to UI concerns only.

**Data Flow:** User actions trigger `customDispatch` in `BoardProvider.jsx` , which performs optimistic UI updates via reducer dispatch, persists to IndexedDB through `storage.js`, and queues operations for server sync via `useOfflineSync` hook. The unidirectional flow prevents data inconsistencies.

**Folder Structure:** We organize by feature rather than file type: `components/` for UI, `context/` for state management, `hooks/` for reusable logic (`useBoardState.js`, `useOfflineSync.js`), `services/` for data persistence (`storage.js`) and API communication (`apiClient.js`), and `utils/` for helper functions like `merge.js` for conflict resolution.

**Reasoning:** This architecture prioritizes offline-first functionality. By centralizing state and using reducer patterns, we ensure data consistency even when network requests fail. The separation of concerns allows each layer to be tested independently, and the hook-based approach (`useBoardState.js`) provides a clean API for components without exposing reducer internals.

