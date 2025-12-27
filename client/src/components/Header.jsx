const Header = ({ isOnline, _isSyncing, conflictCount, onShowConflicts }) => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">JiraLite</h1>
                {!isOnline && (
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        Offline
                    </span>
                )}
            </div>
            <div className="flex items-center gap-3">
                {conflictCount > 0 && (
                    <button
                        onClick={onShowConflicts}
                        className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        {conflictCount} Conflict{conflictCount !== 1 ? 's' : ''}
                    </button>
                )}
                <button className="btn-secondary">
                    Archived
                </button>
            </div>
        </header>
    );
};

export default Header;
