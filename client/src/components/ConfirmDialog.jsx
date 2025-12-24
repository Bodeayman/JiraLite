import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, type = 'danger' }) => {
    if (!isOpen) return null;

    const isDelete = type === 'danger' || title.toLowerCase().includes('delete') || title.toLowerCase().includes('archive');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onCancel}
        >
            <div
                className={`rounded-xl shadow-2xl max-w-sm w-full overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200 ${isDelete ? 'bg-white border-2 border-red-200' : 'bg-white'}`}
                onPointerDown={e => e.stopPropagation()}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    {isDelete && (
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    )}
                    <h3 className={`text-lg font-bold mb-2 text-center ${isDelete ? 'text-red-700' : 'text-slate-800'}`}>
                        {title}
                    </h3>
                    <p className="text-slate-600 mb-6 text-center text-sm">{message}</p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-colors ${isDelete
                                    ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                    : 'bg-violet-500 hover:bg-violet-600'
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
