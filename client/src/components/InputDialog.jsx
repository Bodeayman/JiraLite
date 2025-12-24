import React, { useState, useEffect, useRef } from 'react';

const InputDialog = ({ isOpen, title, message, placeholder, initialValue = '', onConfirm, onCancel }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setInputValue(initialValue);
            // Focus input when dialog opens
            setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 100);
        }
    }, [isOpen, initialValue]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            onCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
                    {message && <p className="text-slate-600 mb-4 text-sm">{message}</p>}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all mb-6"
                    />
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!inputValue.trim()}
                            className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium shadow-sm transition-colors"
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

