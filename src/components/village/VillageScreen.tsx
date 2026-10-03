import { useEffect, useState } from 'react';
import { useGame } from '../../core/GameContext';
import { BUILDINGS, gemsToFinish, type BuildingType } from '../../config/BuildingsConfig';
import { VillageManager } from '../../core/VillageManager';
import { VillageScene, formatDuration } from './VillageScene';
import { BuildingPanel } from './BuildingPanel';
import { Sheet } from '../ui/Sheet';
import { AudioManager } from '../../core/AudioManager';

type Moving = { uid: string; x: number; z: number; valid: boolean; origX: number; origZ: number };

/** Shop for new buildings (defenses, farm and walls) — the hammer button. */
export const BuildShop: React.FC<{ onClose: () => void; onBuilt: (uid: string) => void }> = ({ onClose, onBuilt }) => {
  const { state, buildBuilding } = useGame();
  const types: BuildingType[] = ['farm', 'cannon', 'archertower', 'wall'];
  const th = VillageManager.townhallLevel(state);

  return (
    <Sheet title="🔨 Construir y Fortificar" onClose={onClose}>
      <div className="card-grid">
        {types.map(t => {
          const d = BUILDINGS[t];
          const blocker = VillageManager.buildBlocker(state, t);
          const icon = t === 'farm' ? '🌾' : t === 'cannon' ? '💣' : t === 'archertower' ? '🏹' : '🧱';
          return (
            <div key={t} className="store-card flex-col gap-2">
              <div className="flex-row justify-between">
                <b>{icon} {d.name}</b>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {VillageManager.countOf(state, t)}/{d.maxCount(th)}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.description}</p>
              <button className="btn-upgrade" disabled={!!blocker} style={{ padding: '10px', marginTop: 'auto' }}
                onClick={() => { const uid = buildBuilding(t); if (uid) onBuilt(uid); }}>
                {blocker ?? `Construir — 🪙 ${d.buildCost}`}
              </button>
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
        Sube el Ayuntamiento para desbloquear más granjas, defensas y muros. Construye granjas para cosechar trigo y alimentar a tus mineros gratis.
      </p>
    </Sheet>
  );
};

export const VillageScreen: React.FC<{
  buildOpen: boolean;
  onCloseBuild: () => void;
  onOpenBuild?: () => void;
  onFocusChange?: (focused: boolean) => void;
}> = ({ buildOpen, onCloseBuild, onOpenBuild: _onOpenBuild, onFocusChange }) => {
  const { state, startBuildingUpgrade, finishBuildingUpgrade, moveBuilding, collectMine, buildBuilding } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [moving, setMoving] = useState<Moving | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [internalBuildOpen, setInternalBuildOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);


  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const id = setInterval(updateNow, 500);
    document.addEventListener('visibilitychange', updateNow);
    window.addEventListener('focus', updateNow);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', updateNow);
      window.removeEventListener('focus', updateNow);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  const selected = selectedUid ? VillageManager.get(state, selectedUid) : undefined;
  const focused = !!selected || !!moving;
  useEffect(() => { onFocusChange?.(focused); }, [focused, onFocusChange]);

  // A freshly built defense goes straight into placement mode once it exists in state
  const [pendingMoveUid, setPendingMoveUid] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingMoveUid) return;
    const b = VillageManager.get(state, pendingMoveUid);
    if (!b) return;
    setPendingMoveUid(null);
    setSelectedUid(b.uid);
    setMoving({ uid: b.uid, x: b.x, z: b.z, valid: true, origX: b.x, origZ: b.z });
  }, [pendingMoveUid, state]);

  const startMove = (uid: string) => {
    const b = VillageManager.get(state, uid);
    if (!b) return;
    setSelectedUid(uid);
    setMoving({ uid, x: b.x, z: b.z, valid: true, origX: b.x, origZ: b.z });
  };

  const onMoveTo = (x: number, z: number) => {
    if (!moving) return;
    const b = VillageManager.get(state, moving.uid);
    if (!b) return;
    setMoving({ ...moving, x, z, valid: VillageManager.canPlace(state, b.type, x, z, b.uid) });
  };

  const confirmMove = () => {
    if (moving?.valid) moveBuilding(moving.uid, moving.x, moving.z);
    setMoving(null);
  };

  const collect = (uid: string) => {
    const b = VillageManager.get(state, uid);
    const amount = collectMine(uid);
    if (amount > 0) {
      if (b?.type === 'farm') {
        AudioManager.playClick();
        setToast(`+${amount} 🍞`);
      } else {
        AudioManager.playCoins();
        setToast(`+${amount} 🪙`);
      }
    }
  };

  const renderActionBar = () => {
    if (moving) {
      return (
        <div className="action-bar">
          <span className="action-bar-hint">Arrastra sobre el terreno para mover</span>
          <button className="action-btn ok" disabled={!moving.valid} onClick={confirmMove}>✔<span>Colocar</span></button>
          <button className="action-btn cancel" onClick={() => setMoving(null)}>✖<span>Cancelar</span></button>
        </div>
      );
    }
    if (!selected) return null;
    const upgrading = selected.upgradingUntil > now;
    const blocker = VillageManager.upgradeBlocker(state, selected);
    const cost = VillageManager.upgradeCost(selected);
    const finishCost = upgrading ? gemsToFinish(selected.upgradingUntil - now) : 0;
    const durationSec = VillageManager.upgradeDuration(selected, state.playerKingdom);
    return (
      <div className="action-bar">
        <div className="action-bar-title">
          <b>{BUILDINGS[selected.type].name}</b> <span>Nv.{selected.level}</span>
        </div>
        <button className="action-btn" onClick={() => setInfoOpen(true)}>ℹ️<span>Info</span></button>
        {selected.type === 'goldmine' && selected.stored >= 1 && (
          <button className="action-btn gold" onClick={() => collect(selected.uid)}>🪙<span>{Math.floor(selected.stored)}</span></button>
        )}
        {selected.type === 'farm' && selected.stored >= 1 && (
          <button className="action-btn" style={{ borderColor: 'rgba(245, 158, 11, 0.7)', color: '#fbbf24' }} onClick={() => collect(selected.uid)}>🌾<span>{Math.floor(selected.stored)} 🍞</span></button>
        )}
        {upgrading ? (
          <>
            <button className="action-btn" disabled>🔨<span>{formatDuration(selected.upgradingUntil - now)}</span></button>
            <button className="action-btn gem" disabled={state.gems < finishCost} onClick={() => { finishBuildingUpgrade(selected.uid); AudioManager.playLevelUp(); }}>
              ⏩<span>💎 {finishCost}</span>
            </button>
          </>
        ) : VillageManager.isUpgradable(selected.type) && (
          <button className="action-btn upgrade" disabled={!!blocker} title={blocker ?? ''}
            onClick={() => { startBuildingUpgrade(selected.uid); AudioManager.playBuildingHit(); }}>
            ⬆️<span>{blocker && blocker !== 'Oro insuficiente' ? blocker : `🪙 ${cost} (⏱️ ${formatDuration(durationSec * 1000)})`}</span>
          </button>
        )}
        {selected.type === 'wall' && (
          <button
            className="action-btn gold"
            disabled={!!VillageManager.buildBlocker(state, 'wall')}
            onClick={() => {
              const uid = buildBuilding('wall');
              if (uid) setPendingMoveUid(uid);
            }}
            title="Construir otro muro y colocarlo en tu aldea"
          >
            🧱<span>+ Muro</span>
          </button>
        )}
        {selected.type === 'farm' && <button className="action-btn" onClick={() => setInfoOpen(true)}>🌾<span>Molino</span></button>}
        {selected.type === 'barracks' && <button className="action-btn" onClick={() => setInfoOpen(true)}>⚔️<span>Entrenar</span></button>}
        {selected.type === 'blacksmith' && <button className="action-btn upgrade" onClick={() => setInfoOpen(true)}>⚒️<span>Mejorar</span></button>}
        {selected.type === 'altar' && <button className="action-btn gem" onClick={() => setInfoOpen(true)}>🔱<span>Héroe</span></button>}
        {selected.type === 'townhall' && <button className="action-btn" onClick={() => setInfoOpen(true)}>🛡️<span>Defensa</span></button>}
        <button className="action-btn" onClick={() => startMove(selected.uid)}>✥<span>Mover</span></button>
      </div>
    );
  };

  return (
    <div className="village-screen">
      <VillageScene
        village={state.village}
        now={now}
        selectedUid={selectedUid}
        moving={moving}
        kingdom={state.playerKingdom}
        garrison={state.garrison}
        troops={state.troops}
        heroLevel={state.heroLevel}
        heroRecoveringUntil={state.heroRecoveringUntil}
        onSelect={setSelectedUid}
        onMoveTo={onMoveTo}
        onCollect={collect}
      />
      {renderActionBar()}
      {toast && <div className="village-toast animate-float-up">{toast}</div>}
      {infoOpen && selected && <BuildingPanel building={selected} onClose={() => setInfoOpen(false)} />}
      {(buildOpen || internalBuildOpen) && (
        <BuildShop
          onClose={() => { onCloseBuild(); setInternalBuildOpen(false); }}
          onBuilt={uid => { onCloseBuild(); setInternalBuildOpen(false); setPendingMoveUid(uid); }}
        />
      )}
    </div>
  );
};
