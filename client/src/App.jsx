import Header from './components/Header';
import Board from './components/Board';
import './styles/global.css';

function App() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-violet-100 selection:text-violet-900">
      <Header />
      <Board />
    </div>
  );
}

export default App;
