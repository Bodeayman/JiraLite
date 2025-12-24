import { useState } from 'react';
import { useBoard } from '../context/BoardProvider';

const Toolbar = () => {
    const [listName, setListName] = useState('');
    const { dispatch } = useBoard();

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
        </div>
    );
};

export default Toolbar;
