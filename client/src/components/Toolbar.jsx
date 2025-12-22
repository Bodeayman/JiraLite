

const Toolbar = () => {
    return (
        <div className="toolbar-container">
            <input
                type="text"
                placeholder="List name"
                className="input-text"
            />
            <button className="btn-primary">
                Create List
            </button>
        </div>
    );
};

export default Toolbar;
