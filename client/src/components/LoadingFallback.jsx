import { memo } from 'react';

/**
 * Custom informative fallback component for React.Suspense
 * Displays a loading state with helpful information while lazy-loaded components are being fetched
 */
const LoadingFallback = memo(({ message = 'Loading component...', showSpinner = true }) => {
    return (
        <div className="fixed inset-0 z-40 flex justify-center items-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-white/50">
                <div className="flex flex-col items-center justify-center space-y-4">
                    {showSpinner && (
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 border-4 border-violet-200 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-violet-600 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                    )}
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-semibold text-slate-800">Loading Card Details</h3>
                        <p className="text-sm text-slate-600">{message}</p>
                        <p className="text-xs text-slate-400 mt-2">
                            Please wait while we load the component...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
});

LoadingFallback.displayName = 'LoadingFallback';

export default LoadingFallback;

