import { useEffect, useState } from 'react';
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
      <div className="app-shell">
        <BottomNav currentView={currentView} onViewChange={setCurrentView} badges={{ pvp: state.defenseLog.filter(e => !e.seen).length }} />
        <div className="app-main">
          <TopBar />
          <div className={`screen-container animate-pop ${currentView === 'home' ? 'screen-full' : ''}`} key={currentView}>
            {currentView === 'home' && <MainScreen />}
            {currentView === 'map' && <MapScreen />}
            {currentView === 'pvp' && <PvpScreen />}
            {currentView === 'quests' && <QuestScreen />}
            {currentView === 'store' && <StoreScreen />}
            {currentView === 'settings' && <SettingsScreen />}
          </div>
        </div>
      </div>
    </>
  );
};

// The game is landscape-only: ask phones held upright to rotate
const RotateHint: React.FC = () => (
  <div className="rotate-hint">
    <div className="rotate-hint-icon">📱</div>
    <h2 className="title-clash" style={{ color: 'var(--accent-gold)', fontSize: '22px' }}>Gira tu dispositivo</h2>
    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Mini Kingdom se juega en horizontal.</p>
  </div>
);

function lockLandscape() {
  const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  orientation?.lock?.('landscape').catch(() => { /* only allowed in fullscreen/installed apps */ });
}

function App() {
  useEffect(() => {
    lockLandscape();
    window.addEventListener('pointerdown', lockLandscape, { once: true });
    return () => window.removeEventListener('pointerdown', lockLandscape);
  }, []);

  return (
    <GameProvider>
      <GameApp />
      <RotateHint />
    </GameProvider>
  );
}

export default App;
