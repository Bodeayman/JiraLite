import Header from './components/Header';
import Toolbar from './components/Toolbar';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main>
        <Toolbar />
        <div className="p-6">
          {/* Dashboard content will go here */}
        </div>
      </main>
    </div>
  )
}

export default App
