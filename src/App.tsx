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

export type ViewType = 'home' | 'map' | 'quests' | 'store' | 'settings';

const GameApp: React.FC = () => {
  const { state } = useGame();
  const [currentView, setCurrentView] = useState<ViewType>('home');

  // Show character creation if setup not completed
  if (!state.hasCompletedSetup) {
    return <CharacterCreation />;
  }

  return (
    <>
      <TopBar />
      <div className="screen-container animate-pop" key={currentView}>
        {currentView === 'home' && <MainScreen />}
        {currentView === 'map' && <MapScreen />}
        {currentView === 'quests' && <QuestScreen />}
        {currentView === 'store' && <StoreScreen />}
        {currentView === 'settings' && <SettingsScreen />}
      </div>
      <BottomNav currentView={currentView} onViewChange={setCurrentView} />
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
