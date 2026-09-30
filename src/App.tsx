import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './core/AuthContext';
import { GameProvider, useGame } from './core/GameContext';
import './index.css';

import { LoadingScreen } from './components/LoadingScreen';
import { AuthScreen } from './components/AuthScreen';
import { MapScreen } from './components/MapScreen';
import { QuestScreen } from './components/QuestScreen';
import { StoreScreen } from './components/StoreScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { CharacterCreation } from './components/CharacterCreation';
import { AttackScreen } from './components/attack/AttackScreen';
import { VillageScreen } from './components/village/VillageScreen';
import { Hud } from './components/Hud';
import { Sheet } from './components/ui/Sheet';
import { DefenseLogPanel } from './components/panels/Panels';

export type PanelType = 'attack' | 'multiplayer' | 'map' | 'quests' | 'store' | 'settings' | 'log' | 'build';

const GameApp: React.FC = () => {
  const { state, offlineEarnings, dismissOfflineEarnings } = useGame();
  const [panel, setPanel] = useState<PanelType | null>(null);
  const [villageFocused, setVillageFocused] = useState(false);

  // Show character creation if setup not completed
  if (!state.hasCompletedSetup) {
    return <CharacterCreation />;
  }

  const close = () => setPanel(null);

  return (
    <div className="game-root">
      <VillageScreen buildOpen={panel === 'build'} onCloseBuild={close} onFocusChange={setVillageFocused} />
      <Hud onOpen={setPanel} compact={villageFocused} />

      {panel === 'attack' && (
        <Sheet title="⚔️ Atacar" onClose={close}>
          <div className="card-grid">
            <button className="attack-mode-card multiplayer" onClick={() => setPanel('multiplayer')}>
              <span className="attack-mode-icon">⚔️</span>
              <b>Multijugador</b>
              <span>Saquea aldeas de otros jugadores y gana trofeos.</span>
            </button>
            <button className="attack-mode-card campaign" onClick={() => setPanel('map')}>
              <span className="attack-mode-icon">🗺️</span>
              <b>Campaña</b>
              <span>Conquista territorios, vence a los jefes y despierta Dioses.</span>
            </button>
          </div>
        </Sheet>
      )}
      {panel === 'multiplayer' && <AttackScreen onClose={close} />}
      {panel === 'map' && <Sheet title="🗺️ Campaña" onClose={close} wide><MapScreen /></Sheet>}
      {panel === 'quests' && <Sheet title="📜 Misiones" onClose={close} wide><QuestScreen /></Sheet>}
      {panel === 'store' && <Sheet title="💎 Tienda" onClose={close} wide><StoreScreen /></Sheet>}
      {panel === 'settings' && <Sheet title="⚙️ Ajustes" onClose={close}><SettingsScreen /></Sheet>}
      {panel === 'log' && <Sheet title="🛡️ Registro de defensa" onClose={close} wide><DefenseLogPanel /></Sheet>}

      {offlineEarnings > 0 && (
        <Sheet title="¡Bienvenido de vuelta!" onClose={dismissOfflineEarnings}>
          <div className="flex-col gap-3" style={{ alignItems: 'center', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Tu mina siguió trabajando mientras no estabas:</p>
            <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--accent-gold)' }}>+ {offlineEarnings.toLocaleString()} 🪙</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Toca la mina para recoger el oro.</p>
            <button className="btn-upgrade" onClick={dismissOfflineEarnings} style={{ width: '100%', padding: '12px' }}>¡Vamos!</button>
          </div>
        </Sheet>
      )}
    </div>
  );
};

const MainFlow: React.FC = () => {
  const [resourceDownloaded, setResourceDownloaded] = useState(false);
  const { user, isLoading } = useAuth();

  // 1. Initial screen: resource download progress & Clash animation
  if (!resourceDownloaded) {
    return <LoadingScreen onLoaded={() => setResourceDownloaded(true)} />;
  }

  // 2. Waiting for initial auth check
  if (isLoading) {
    return <LoadingScreen onLoaded={() => {}} />;
  }

  // 3. If player is not logged in and has not chosen guest mode
  if (!user) {
    return <AuthScreen onSuccess={() => {}} />;
  }

  // 4. Authenticated or guest -> Launch game
  return <GameApp />;
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
    <AuthProvider>
      <GameProvider>
        <MainFlow />
        <RotateHint />
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
