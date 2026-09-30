import { useState } from 'react';
import { GameProvider, useGame } from './core/GameContext';
import './index.css';

// Componentes
import { TopBar } from './components/TopBar';
import { MainScreen } from './components/MainScreen';
import { MapScreen } from './components/MapScreen';
import { BottomNav } from './components/BottomNav';
import { QuestScreen } from './components/QuestScreen';
import { StoreScreen } from './components/StoreScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CharacterCreation } from './components/CharacterCreation';
import { PvpScreen } from './components/PvpScreen';

export type ViewType = 'home' | 'map' | 'pvp' | 'quests' | 'store' | 'settings';

const GameApp: React.FC = () => {
  const { state, offlineEarnings, dismissOfflineEarnings } = useGame();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  // Show character creation if setup not completed
  if (!state.hasCompletedSetup) {
    return <CharacterCreation />;
  }

  return (
    <>
      {offlineEarnings > 0 && (
        <div className="building-modal-overlay" onClick={dismissOfflineEarnings} style={{ zIndex: 2000 }}>
          <div className="building-modal animate-pop" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h2 className="title-clash" style={{ color: 'var(--accent-gold)' }}>¡Bienvenido de vuelta!</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>Tu reino generó mientras no estabas:</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-gold)' }}>+ {offlineEarnings.toLocaleString()} 🪙</p>
            <button className="btn-upgrade" onClick={dismissOfflineEarnings} style={{ width: '100%', padding: '12px', marginTop: '16px' }}>Recoger</button>
          </div>
        </div>
      )}
      <TopBar />
      <div className="screen-container animate-pop" key={currentView}>
        {currentView === 'home' && <MainScreen />}
        {currentView === 'map' && <MapScreen />}
        {currentView === 'pvp' && <PvpScreen />}
        {currentView === 'quests' && <QuestScreen />}
        {currentView === 'store' && <StoreScreen />}
        {currentView === 'settings' && <SettingsScreen />}
      </div>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} badges={{ pvp: state.defenseLog.filter(e => !e.seen).length }} />
    </>
  );
};

function App() {
  return (
    <GameProvider>
      <GameApp />
    </GameProvider>
  );
}

export default App;
