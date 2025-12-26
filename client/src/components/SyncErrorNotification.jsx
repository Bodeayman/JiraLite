import { memo } from 'react';

const SyncErrorNotification = memo(({ errors, onDismiss }) => {
    if (!errors || errors.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {errors.map((error) => (
                <div
                    key={error.id}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md animate-in slide-in-from-right"
                    role="alert"
                    aria-live="assertive"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                            <svg
                                className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-800">
                                    Sync Failed
                                </h3>
                                <p className="text-sm text-red-700 mt-1">
                                    {error.message}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    Operation: {error.operation}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onDismiss(error.id)}
                            className="text-red-400 hover:text-red-600 transition-colors ml-4"
                            aria-label="Dismiss error"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
});

SyncErrorNotification.displayName = 'SyncErrorNotification';

export default SyncErrorNotification;

