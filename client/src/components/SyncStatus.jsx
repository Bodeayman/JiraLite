export default function SyncStatus({ isOnline, isSyncing, lastSyncTime, conflictCount, onShowConflicts }) {
    if (!isOnline) {
        return (
            <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-40">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                Offline Mode
            </div>
        );
    }

    if (conflictCount > 0) {
        return (
            <button
                onClick={onShowConflicts}
                className="fixed bottom-4 right-4 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-40 transition-colors"
            >
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                {conflictCount} Sync Conflict{conflictCount > 1 ? 's' : ''}
            </button>
        );
    }

    if (isSyncing) {
        return (
            <div className="fixed bottom-4 right-4 bg-violet-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm z-40">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                Syncing...
            </div>
        );
    }

    return null;
}