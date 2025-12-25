import { useState } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import ConflictResolver from './components/ConflictResolver';
import SyncStatus from './components/SyncStatus';
import { useBoard } from './context/BoardProvider';
import './styles/global.css';

function App() {
  const { isOnline, isSyncing, conflicts, resolveConflict } = useBoard();
  const [showConflicts, setShowConflicts] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-800 font-sans selection:bg-violet-100 selection:text-violet-900">
      <Header
        isOnline={isOnline}
        isSyncing={isSyncing}
        conflictCount={conflicts.length}
        onShowConflicts={() => setShowConflicts(true)}
      />

      <Board />

      <SyncStatus
        isOnline={isOnline}
        isSyncing={isSyncing}
        conflictCount={conflicts.length}
        onShowConflicts={() => setShowConflicts(true)}
      />

      {/* Conflict Resolution Modal */}
      {showConflicts && conflicts.length > 0 && (
        <ConflictResolver
          conflicts={conflicts}
          onResolve={resolveConflict}
          onCancel={() => setShowConflicts(false)}
        />
      )}
    </div>
  );
}

export default App;
