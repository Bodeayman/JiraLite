import { useState, useEffect, useRef, memo, useCallback } from 'react';

const CardDetailModal = memo(({ card, onClose, onDelete, onUpdate }) => {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description || '');
    const [newTag, setNewTag] = useState('');
    const [tags, setTags] = useState(card.tags || []);

    // Update local state when card prop changes (if switching cards without closing)
    useEffect(() => {
        setTitle(card.title);
        setDescription(card.description || '');
        setTags(card.tags || []);
    }, [card]);

    const handleSave = useCallback(() => {
        onUpdate(card.id, {
            title,
            description,
            tags
        });
        onClose();
    }, [card.id, title, description, tags, onUpdate, onClose]);

    const handleAddTag = useCallback((e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            setTags(prevTags => {
                if (!prevTags.includes(newTag.trim())) {
                    return [...prevTags, newTag.trim()];
                }
                return prevTags;
            });
            setNewTag('');
        }
    }, [newTag]);

    const removeTag = useCallback((tagToRemove) => {
        setTags(prevTags => prevTags.filter(tag => tag !== tagToRemove));
    }, []);

    return (
        <div className="fixed inset-0 z-40 flex justify-center items-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200" onPointerDown={e => e.stopPropagation()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300 border border-white/50">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
                    <div className="w-full mr-8">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Card Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-transparent text-xl font-bold text-slate-800 border-none p-0 focus:ring-0 placeholder-slate-300"
                            placeholder="Enter card title..."
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full transition-all shadow-sm border border-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto space-y-8 flex-1">
                    {/* Description Section */}
                    <div className="group">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 transition-all resize-y text-base leading-relaxed"
                            placeholder="Add a more detailed description..."
                        />
                    </div>

                    {/* Tags Section */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                            Tags
                        </label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-sm font-medium border border-violet-100 group"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="text-violet-400 hover:text-violet-700 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={handleAddTag}
                                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all placeholder-slate-400"
                                placeholder="+ Add tag"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex justify-between items-center">
                    <button
                        onClick={() => onDelete(card.id)}
                        className="btn-danger flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Delete Card
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CardDetailModal.displayName = 'CardDetailModal';

export default CardDetailModal;
