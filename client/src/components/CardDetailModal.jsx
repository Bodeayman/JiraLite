const CardDetailModal = ({ card, onClose, onDelete, onEdit }) => {
    if (!card) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-start">
                    <h2 className="text-xl font-bold text-gray-800">{card.title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        X
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-sm uppercase font-bold text-gray-500 mb-2">Description</h3>
                        <p className="text-gray-700">{card.description || "No description provided."}</p>
                    </div>

                    <div>
                        <h3 className="text-sm uppercase font-bold text-gray-500 mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {card.tags && card.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={() => onDelete(card.id)}
                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded font-medium transition"
                    >
                        Delete
                    </button>
                    <button
                        onClick={() => onEdit(card)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-medium transition"
                    >
                        Edit
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CardDetailModal;
