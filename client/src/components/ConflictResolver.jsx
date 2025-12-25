import { useState } from 'react';

const ConflictResolver = ({ conflicts, onResolve, onCancel }) => {
    // conflicts: [{ id, base, local, server }]
    // We handle one at a time or all? Let's do one at a time for simplicity.
    const [currentIndex, setCurrentIndex] = useState(0);
    const currentConflict = conflicts[currentIndex];

    if (!currentConflict) return null;

    const { local, server } = currentConflict;
    const type = local.title ? (local.cards ? 'List' : 'Card') : 'Unknown';

    const handleResolve = (resolution) => {
        // resolution: 'local' (mine), 'server' (theirs)
        onResolve(currentConflict.id, resolution);
        if (currentIndex < conflicts.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl p-6 border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="text-amber-500">⚠️</span>
                    Sync Conflict Detected
                </h2>

                <p className="text-slate-600 mb-6">
                    Changes you made while offline conflict with updates on the server.
                    Please choose which version to keep for this <strong>{type}</strong>.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    {/* Local Version */}
                    <div className="border border-violet-200 rounded-lg p-4 bg-violet-50">
                        <h3 className="font-semibold text-violet-900 mb-2">Your Version</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                            <p><strong>Title:</strong> {local.title}</p>
                            {local.description !== undefined && (
                                <p><strong>Desc:</strong> {local.description}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-2">
                                Last Modified: {new Date(local.lastModifiedAt || Date.now()).toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            onClick={() => handleResolve('local')}
                            className="mt-4 w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded font-medium transition-colors"
                        >
                            Keep Mine
                        </button>
                    </div>

                    {/* Server Version */}
                    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <h3 className="font-semibold text-slate-900 mb-2">Server Version</h3>
                        <div className="space-y-2 text-sm text-slate-700">
                            <p><strong>Title:</strong> {server.title}</p>
                            {server.description !== undefined && (
                                <p><strong>Desc:</strong> {server.description}</p>
                            )}
                            <p className="text-xs text-slate-500 mt-2">
                                Last Modified: {new Date(server.lastModifiedAt || Date.now()).toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            onClick={() => handleResolve('server')}
                            className="mt-4 w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded font-medium transition-colors"
                        >
                            Keep Theirs
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm text-slate-500">
                    <span>Conflict {currentIndex + 1} of {conflicts.length}</span>
                    <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
                        Cancel Sync
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConflictResolver;