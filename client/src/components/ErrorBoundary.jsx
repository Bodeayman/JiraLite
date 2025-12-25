import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            // Check if it's a chunk load error (common with lazy loading offline)
            const isChunkError = this.state.error?.name === 'ChunkLoadError' ||
                this.state.error?.message?.includes('Loading chunk');

            if (this.props.fallback) {
                return this.props.fallback(this.state.error, () => this.setState({ hasError: false }));
            }

            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
                    <p className="text-red-600 mb-4">
                        {isChunkError
                            ? "We couldn't load this part of the app. You might be offline."
                            : "An unexpected error occurred while displaying this content."}
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
