import { useState } from 'react';
import { useBoard } from '../context/BoardProvider';

const Toolbar = () => {
    const [listName, setListName] = useState('');
    const {
        dispatch,
        undo,
        redo,
        canUndo,
        canRedo,
        historySize,
        redoSize
    } = useBoard();

    const handleCreateList = () => {
        if (!listName.trim()) return;

        dispatch({ type: 'ADD_LIST', payload: listName });
        setListName('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCreateList();
        }
    };

    return (
        <div className="p-5 text-center w-full bg-white border-b border-slate-200">
            <input
                type="text"
                placeholder="List name"
                className="input-text"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button
                className="btn-primary mt-5"
                onClick={handleCreateList}
            >
                Create List
            </button>
            <div className="inline-flex items-center gap-2 ml-4">
                <button
                    className={`btn-secondary ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={undo}
                    disabled={!canUndo}
                    title={`Undo (Ctrl/Cmd+Z)${historySize > 0 ? ` - ${historySize} actions` : ''}`}
                >
                    ⎌ Undo {historySize > 0 && `(${historySize})`}
                </button>
                <button
                    className={`btn-secondary ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={redo}
                    disabled={!canRedo}
                    title={`Redo (Ctrl/Cmd+Shift+Z)${redoSize > 0 ? ` - ${redoSize} actions` : ''}`}
                >
                    ⎌ Redo {redoSize > 0 && `(${redoSize})`}
                </button>
            </div>
        </div>
    );
};

export default Toolbar;