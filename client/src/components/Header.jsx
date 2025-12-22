

const Header = () => {
    return (
        <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">JiraLite</h1>
            <button className="btn-secondary">
                Archived
            </button>
        </header>
    );
};

export default Header;
