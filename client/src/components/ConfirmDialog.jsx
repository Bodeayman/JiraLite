import { useEffect, useRef } from 'react';

const ConfirmDialog = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    type = 'danger',
}) => {
    const dialogRef = useRef(null);
    const cancelRef = useRef(null);

    const isDelete =
        type === 'danger' ||
        title?.toLowerCase().includes('delete') ||
        title?.toLowerCase().includes('archive');

    /* =========================
       ESC to close
    ========================= */
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onCancel]);

    /* =========================
       Initial focus
    ========================= */
    useEffect(() => {
        if (!isOpen) return;
        cancelRef.current?.focus();
    }, [isOpen]);

    /* =========================
       Focus trap
    ========================= */
    useEffect(() => {
        if (!isOpen) return;

        const focusableSelectors =
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

        const focusableElements =
            dialogRef.current?.querySelectorAll(focusableSelectors);

        if (!focusableElements || focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onCancel();
        }
    };

    const handleBackdropKeyDown = (e) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            onKeyDown={handleBackdropKeyDown}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
        >
            <div
                ref={dialogRef}
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
                className={`rounded-xl shadow-2xl max-w-sm w-full overflow-hidden bg-white ${isDelete ? 'border-2 border-red-200' : ''
                    }`}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    {isDelete && (
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                    )}

                    <h3
                        id="confirm-dialog-title"
                        className={`text-lg font-bold mb-2 text-center ${isDelete ? 'text-red-700' : 'text-slate-800'
                            }`}
                    >
                        {title}
                    </h3>

                    <p
                        id="confirm-dialog-message"
                        className="text-slate-600 mb-6 text-center text-sm"
                    >
                        {message}
                    </p>

                    <div className="flex justify-end gap-3">
                        <button
                            ref={cancelRef}
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            Cancel
                        </button>

                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDelete
                                ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500'
                                : 'bg-violet-500 hover:bg-violet-600 focus:ring-violet-500'
                                }`}
                        >
                            {isDelete ? 'Delete' : 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;