export default function SyncStatus({ isOnline, isSyncing, conflictCount, onShowConflicts }) {
    if (!isOnline) {
        return (
            <div className="fixed bottom-6 right-6 bg-slate-900/90 backdrop-blur-sm text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-sm z-[100] border border-white/10">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
                <span className="font-medium tracking-tight">Offline Mode</span>
            </div>
        );
    }

    if (conflictCount > 0) {
        return (
            <button
                onClick={onShowConflicts}
                className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-sm z-[100] transition-all transform hover:scale-105 active:scale-95 border border-amber-400"
            >
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                <span className="font-medium tracking-tight">{conflictCount} Sync Conflict{conflictCount > 1 ? 's' : ''}</span>
            </button>
        );
    }

    if (isSyncing) {
        return (
            <div className="fixed bottom-6 right-6 bg-violet-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-3 text-sm z-[100] border border-violet-500">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                <span className="font-medium tracking-tight">Syncing Changes...</span>
            </div>
        );
    }

    return null;
}