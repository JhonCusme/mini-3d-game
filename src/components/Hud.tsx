import { useGame } from '../core/GameContext';
import { GameConfig } from '../config/GameConfig';
import { QuestManager } from '../core/QuestManager';
import { VillageManager } from '../core/VillageManager';
import { leagueFor } from '../core/pvp/PvpRules';
import { AVATAR_IMAGES } from './troopIcons';
import type { PanelType } from '../App';

import { getKingdomConfig } from '../config/KingdomsConfig';
import { TroopUpgradeManager } from '../core/TroopUpgradeManager';
import { FriendsManager } from '../core/friends/FriendsManager';
import type { TroopId } from '../core/GameState';

const Badge: React.FC<{ n: number }> = ({ n }) => (n > 0 ? <span className="hud-badge">{n}</span> : null);

/** Clash-style overlay: profile top-left, resources top-right, attack bottom-left, menus bottom-right. */
export const Hud: React.FC<{ onOpen: (p: PanelType) => void; compact?: boolean }> = ({ onOpen, compact }) => {
  const { state, buyBuilder } = useGame();
  const league = leagueFor(state.trophies);
  const kingdomInfo = getKingdomConfig(state.playerKingdom);
  const freeBuilders = VillageManager.freeBuilders(state);
  const builderCost = VillageManager.nextBuilderCost(state);
  const claimable = GameConfig.quests.filter(q => QuestManager.canClaimQuest(state, q.id)).length;
  const unseenLog = state.defenseLog.filter(e => !e.seen).length;
  const upgradeableCount = (Object.keys(GameConfig.troops) as TroopId[]).filter(id => TroopUpgradeManager.canUpgrade(state, id)).length;
  const pendingFriends = FriendsManager.getLocalRequests(state.playerId).length;

  const maxGold = VillageManager.maxGoldCapacity(state);
  const maxFood = VillageManager.maxFoodCapacity(state);
  const goldPct = Math.min(100, (state.coins / Math.max(1, maxGold)) * 100);
  const foodPct = Math.min(100, ((state.food || 0) / Math.max(1, maxFood)) * 100);
  const formatCap = (n: number) => n >= 10000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : n.toLocaleString();

  return (
    <div className={`hud ${compact ? 'hud-compact' : ''}`}>
      <div className="hud-top-left">
        <div className="hud-profile">
          <img src={AVATAR_IMAGES[state.playerAvatar]} alt="" />
          <div className="flex-col">
            <b>{state.playerName || 'Héroe'}</b>
            <span>{kingdomInfo.icon} Ayunt. Nv.{state.level}</span>
          </div>
        </div>
        <div className="hud-trophies">{league.icon} {state.trophies} 🏆</div>
      </div>

      <button
        className="hud-builders"
        onClick={() => { if (builderCost !== null && state.gems >= builderCost && window.confirm(`¿Contratar otro constructor por 💎 ${builderCost}?`)) buyBuilder(); }}
        title={builderCost !== null ? `Nuevo constructor: 💎 ${builderCost}` : 'Máximo de constructores'}
      >
        👷 <b>{freeBuilders}/{state.builders}</b>
        {builderCost !== null && <span className="hud-plus">+</span>}
      </button>

      <div className="hud-top-right">
        <div className={`hud-res gold ${goldPct >= 99 ? 'is-full' : ''}`} title={`Oro: ${Math.floor(state.coins).toLocaleString()} / ${maxGold.toLocaleString()} (Capacidad de Almacenes)`}>
          <span>🪙</span>
          <div className="hud-res-content">
            <div className="hud-res-numbers">
              <b>{Math.floor(state.coins).toLocaleString()}</b>
              <span className="hud-res-cap">/{formatCap(maxGold)}</span>
            </div>
            <div className="hud-res-bar">
              <div className="hud-res-bar-fill gold" style={{ width: `${goldPct}%` }} />
            </div>
          </div>
        </div>

        <div className={`hud-res food ${foodPct >= 99 ? 'is-full' : ''}`} title={`Comida: ${Math.floor(state.food || 0).toLocaleString()} / ${maxFood.toLocaleString()} (Capacidad de Graneros)`}>
          <span>🍞</span>
          <div className="hud-res-content">
            <div className="hud-res-numbers">
              <b>{Math.floor(state.food || 0).toLocaleString()}</b>
              <span className="hud-res-cap">/{formatCap(maxFood)}</span>
            </div>
            <div className="hud-res-bar">
              <div className="hud-res-bar-fill food" style={{ width: `${foodPct}%` }} />
            </div>
          </div>
        </div>

        <div className="hud-res gem" onClick={() => onOpen('store')}><span>💎</span><b>{state.gems}</b><span className="hud-plus">+</span></div>
        <div className="hud-res energy"><span>⚡</span><b>{state.energy}/{GameConfig.maxEnergy}</b></div>
      </div>

      <div className="hud-bottom-left">
        <button className="hud-attack" onClick={() => onOpen('attack')}>
          <span className="hud-attack-icon">⚔️</span>
          <span>¡Atacar!</span>
        </button>
      </div>

      <div className="hud-bottom-right">
        <button className="hud-btn" onClick={() => onOpen('friends')}>👥<Badge n={pendingFriends} /><span>Amigos</span></button>
        <button className="hud-btn" onClick={() => onOpen('troops')}>🎖️<Badge n={upgradeableCount} /><span>Mejoras</span></button>
        <button className="hud-btn" onClick={() => onOpen('log')}>🛡️<Badge n={unseenLog} /><span>Registro</span></button>
        <button className="hud-btn" onClick={() => onOpen('quests')}>📜<Badge n={claimable} /><span>Misiones</span></button>
        <button className="hud-btn" onClick={() => onOpen('settings')}>⚙️<span>Ajustes</span></button>
        <button className="hud-btn" onClick={() => onOpen('store')}>💎<span>Tienda</span></button>
        <button className="hud-btn big" onClick={() => onOpen('build')}>🔨<span>Construir</span></button>
      </div>
    </div>
  );
};
