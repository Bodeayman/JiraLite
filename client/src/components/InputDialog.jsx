import React, { useState, useEffect, useRef } from 'react';

const InputDialog = ({ isOpen, title, message, placeholder, initialValue = '', onConfirm, onCancel }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const dialogRef = useRef(null);
    const inputRef = useRef(null);
    const cancelButtonRef = useRef(null);

    /* =========================
       Update input value when dialog opens
    ========================= */
    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
        }
    }, [isOpen, initialValue]);

    /* =========================
       Focus input when dialog opens
    ========================= */
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    /* =========================
       ESC key to close
    ========================= */
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    /* =========================
       Focus trap
    ========================= */
    useEffect(() => {
        if (!isOpen) return;

        const focusableSelectors =
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const focusableElements = dialogRef.current?.querySelectorAll(focusableSelectors);

        if (!focusableElements || focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const trapFocus = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (!e.shiftKey && document.activeElement === lastFocusable) {
                e.preventDefault();
                firstFocusable.focus();
            }
        };

        document.addEventListener('keydown', trapFocus);
        return () => document.removeEventListener('keydown', trapFocus);
    }, [isOpen, inputValue]); // Re-run when inputValue changes (affects disabled state)

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
            setInputValue('');
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="input-dialog-title"
                aria-describedby={message ? "input-dialog-description" : undefined}
                className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3
                        id="input-dialog-title"
                        className="text-lg font-bold text-slate-800 mb-2"
                    >
                        {title}
                    </h3>
                    {message && (
                        <p
                            id="input-dialog-description"
                            className="text-slate-600 mb-4 text-sm"
                        >
                            {message}
                        </p>
                    )}
                    <label htmlFor="dialog-input" className="sr-only">
                        {placeholder || title}
                    </label>
                    <input
                        id="dialog-input"
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleInputKeyDown}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all mb-6"
                        aria-required="true"
                        aria-invalid={!inputValue.trim() && inputValue !== ''}
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            ref={cancelButtonRef}
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
                            aria-label="Cancel"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!inputValue.trim()}
                            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
                            aria-label="Confirm"
                            aria-disabled={!inputValue.trim()}
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InputDialog;