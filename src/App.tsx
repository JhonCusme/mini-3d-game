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
import { DefenseLogPanel, TroopUpgradePanel } from './components/panels/Panels';
import { FriendsModal } from './components/social/FriendsModal';
import type { VillageSnapshot } from './core/pvp/PvpTypes';
import type { DefenseLogEntry } from './core/GameState';
import { pvpService } from './core/pvp/PvpService';
import { createSystemVillage, hashString } from './core/pvp/BotFactory';

export type PanelType = 'attack' | 'multiplayer' | 'map' | 'quests' | 'store' | 'settings' | 'log' | 'build' | 'troops' | 'friends';

const GameApp: React.FC = () => {
  const { state, offlineEarnings, dismissOfflineEarnings, markRevengeTaken } = useGame();
  const [panel, setPanel] = useState<PanelType | null>(null);
  const [customOpponent, setCustomOpponent] = useState<VillageSnapshot | null>(null);
  const [isFriendlyBattle, setIsFriendlyBattle] = useState(false);
  const [villageFocused, setVillageFocused] = useState(false);

  // Show character creation if setup not completed
  if (!state.hasCompletedSetup) {
    return <CharacterCreation />;
  }

  const close = () => {
    setPanel(null);
    setCustomOpponent(null);
    setIsFriendlyBattle(false);
  };

  const handleStartFriendlyBattle = (opp: VillageSnapshot) => {
    setCustomOpponent(opp);
    setIsFriendlyBattle(true);
    setPanel('multiplayer');
  };

  const handleStartRevenge = async (entry: DefenseLogEntry) => {
    let opp: VillageSnapshot | null = null;
    if (entry.attackerId) {
      if (entry.attackerId.startsWith('bot_') || entry.attackerId.startsWith('system_')) {
        const seed = hashString(entry.attackerId);
        opp = createSystemVillage(seed, entry.attackerTrophies);
      } else if (pvpService.fetchVillage) {
        opp = await pvpService.fetchVillage(entry.attackerId);
      }
    }
    if (!opp) {
      const seed = hashString((entry.attackerName || 'Rival') + entry.attackerTrophies);
      opp = createSystemVillage(seed, entry.attackerTrophies);
    }

    if (opp.shieldUntil && opp.shieldUntil > Date.now()) {
      alert(`🛡️ ${opp.name} tiene un escudo de protección activo actualmente. ¡Inténtalo más tarde!`);
      return;
    }

    markRevengeTaken(entry.id);
    setCustomOpponent(opp);
    setIsFriendlyBattle(false);
    setPanel('multiplayer');
  };

  return (
    <div className="game-root">
      <VillageScreen
        buildOpen={panel === 'build'}
        onCloseBuild={close}
        onOpenBuild={() => setPanel('build')}
        onFocusChange={setVillageFocused}
      />
      <Hud onOpen={setPanel} compact={villageFocused} />

      {panel === 'attack' && (
        <Sheet title="⚔️ Atacar" onClose={close}>
          <div className="card-grid">
            <button className="attack-mode-card multiplayer" onClick={() => { setCustomOpponent(null); setIsFriendlyBattle(false); setPanel('multiplayer'); }}>
              <span className="attack-mode-icon">⚔️</span>
              <b>Multijugador</b>
              <span>Saquea aldeas de otros jugadores y gana trofeos.</span>
            </button>
            <button className="attack-mode-card campaign" onClick={() => setPanel('map')}>
              <span className="attack-mode-icon">🗺️</span>
              <b>Campaña</b>
              <span>Conquista territorios, vence a los jefes y despierta Dioses.</span>
            </button>
            <button className="attack-mode-card" style={{ border: '2px solid #0984e3', background: 'linear-gradient(135deg, rgba(9, 132, 227, 0.2), rgba(41, 128, 185, 0.3))' }} onClick={() => setPanel('friends')}>
              <span className="attack-mode-icon">🤝</span>
              <b style={{ color: '#74b9ff' }}>Desafío Amistoso</b>
              <span>Practica con amigos o prueba tu propia aldea sin perder tropas ni trofeos.</span>
            </button>
          </div>
        </Sheet>
      )}
      {panel === 'multiplayer' && (
        <AttackScreen
          onClose={close}
          customOpponent={customOpponent || undefined}
          isFriendly={isFriendlyBattle}
        />
      )}
      {panel === 'friends' && (
        <Sheet title="👥 Amigos y Desafíos de Práctica" onClose={close} wide>
          <FriendsModal onClose={close} onStartFriendlyBattle={handleStartFriendlyBattle} />
        </Sheet>
      )}
      {panel === 'map' && <Sheet title="🗺️ Campaña" onClose={close} wide><MapScreen /></Sheet>}
      {panel === 'quests' && <Sheet title="📜 Misiones" onClose={close} wide><QuestScreen /></Sheet>}
      {panel === 'store' && <Sheet title="💎 Tienda" onClose={close} wide><StoreScreen /></Sheet>}
      {panel === 'settings' && <Sheet title="⚙️ Ajustes" onClose={close}><SettingsScreen /></Sheet>}
      {panel === 'log' && (
        <Sheet title="🛡️ Registro de defensa" onClose={close} wide>
          <DefenseLogPanel onRevenge={handleStartRevenge} />
        </Sheet>
      )}
      {panel === 'troops' && (
        <Sheet title="⚒️ Personajes: Tropas y Héroe" onClose={close} wide>
          <TroopUpgradePanel />
        </Sheet>
      )}

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
