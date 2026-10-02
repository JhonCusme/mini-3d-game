import { useEffect, useState } from 'react';
import { useGame } from '../../core/GameContext';
import { BUILDINGS, gemsToFinish, type BuildingType } from '../../config/BuildingsConfig';
import { VillageManager } from '../../core/VillageManager';
import { UpgradeManager } from '../../core/UpgradeManager';
import { PvpManager } from '../../core/pvp/PvpManager';
import { wallMaxHp } from '../../core/pvp/PvpBattle';
import { VillageScene, formatDuration } from './VillageScene';
import { BuildingPanel } from './BuildingPanel';
import { Sheet } from '../ui/Sheet';
import { AudioManager } from '../../core/AudioManager';

type Moving = { uid: string; x: number; z: number; valid: boolean; origX: number; origZ: number };

/** Shop for new buildings (defenses and walls) — the hammer button. */
export const BuildShop: React.FC<{ onClose: () => void; onBuilt: (uid: string) => void }> = ({ onClose, onBuilt }) => {
  const { state, buildBuilding, purchaseUpgrade } = useGame();
  const types: BuildingType[] = ['cannon', 'archertower'];
  const th = VillageManager.townhallLevel(state);
  const wallsLevel = state.upgrades.walls || 0;
  const wallsCost = UpgradeManager.getCost('walls', wallsLevel);
  const defensePreview = PvpManager.buildSnapshot(state);
  const wallHp = wallMaxHp(defensePreview);

  return (
    <Sheet title="🔨 Construir y Fortificar" onClose={onClose}>
      <div className="card-grid">
        {/* Murallas Defensivas Card */}
        <div
          className="store-card flex-col gap-2"
          style={{
            border: '1px solid rgba(255, 215, 0, 0.35)',
            background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.08) 0%, rgba(25, 25, 30, 0.6) 100%)',
          }}
        >
          <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
            <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '22px' }}>🧱</span>
              <div>
                <b style={{ display: 'block', fontSize: '13px' }}>Muralla Perimetral</b>
                <span style={{ fontSize: '11px', color: wallsLevel > 0 ? 'var(--accent-gold)' : 'var(--text-secondary)' }}>
                  {wallsLevel === 0 ? '¡Sin murallas aún!' : `Nivel ${wallsLevel} · ${wallHp} HP`}
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '6px',
                fontWeight: 700,
                background: wallsLevel > 0 ? 'rgba(46, 213, 115, 0.2)' : 'rgba(255, 71, 87, 0.2)',
                color: wallsLevel > 0 ? '#2ed573' : '#ff4757',
              }}
            >
              {wallsLevel === 0 ? 'Perímetro Abierto' : `Fortaleza Nv.${wallsLevel}`}
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {wallsLevel === 0
              ? 'Rodea y fortifica todo el perímetro de tu aldea. Absorbe el daño enemigo antes de que alcancen tus defensas o tropas.'
              : 'Evoluciona de empalizada tribal a muralla de piedra de castillo y obsidiana imperial dorada.'}
          </p>

          <button
            className="btn-upgrade"
            disabled={state.coins < wallsCost}
            style={{ padding: '10px', marginTop: 'auto' }}
            onClick={() => {
              purchaseUpgrade('walls');
              AudioManager.playLevelUp();
            }}
          >
            {state.coins < wallsCost
              ? `Falta oro — 🪙 ${wallsCost.toLocaleString()}`
              : wallsLevel === 0
                ? `Construir Murallas — 🪙 ${wallsCost.toLocaleString()}`
                : `Mejorar a Nv.${wallsLevel + 1} — 🪙 ${wallsCost.toLocaleString()}`}
          </button>
        </div>

        {types.map(t => {
          const d = BUILDINGS[t];
          const blocker = VillageManager.buildBlocker(state, t);
          return (
            <div key={t} className="store-card flex-col gap-2">
              <div className="flex-row justify-between">
                <b>{t === 'cannon' ? '💣' : '🏹'} {d.name}</b>
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
        Sube el Ayuntamiento para desbloquear más defensas y expandir tu reino.
      </p>
    </Sheet>
  );
};

export const VillageScreen: React.FC<{
  buildOpen: boolean;
  onCloseBuild: () => void;
  onOpenBuild?: () => void;
  onFocusChange?: (focused: boolean) => void;
}> = ({ buildOpen, onCloseBuild, onOpenBuild, onFocusChange }) => {
  const { state, startBuildingUpgrade, finishBuildingUpgrade, moveBuilding, collectMine } = useGame();
  const [now, setNow] = useState(() => Date.now());
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [moving, setMoving] = useState<Moving | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [internalBuildOpen, setInternalBuildOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleWallClick = () => {
    const level = state.upgrades.walls || 0;
    if (level === 0) {
      setToast('🧱 Abre Construir para fortificar el perímetro con murallas');
    } else {
      setToast(`🧱 Murallas de la Aldea — Nivel ${level}`);
    }
    if (onOpenBuild) {
      onOpenBuild();
    } else {
      setInternalBuildOpen(true);
    }
  };

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
    const amount = collectMine(uid);
    if (amount > 0) {
      AudioManager.playCoins();
      setToast(`+${amount} 🪙`);
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
    return (
      <div className="action-bar">
        <div className="action-bar-title">
          <b>{BUILDINGS[selected.type].name}</b> <span>Nv.{selected.level}</span>
        </div>
        <button className="action-btn" onClick={() => setInfoOpen(true)}>ℹ️<span>Info</span></button>
        {selected.type === 'goldmine' && selected.stored >= 1 && (
          <button className="action-btn gold" onClick={() => collect(selected.uid)}>🪙<span>{Math.floor(selected.stored)}</span></button>
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
            ⬆️<span>{blocker && blocker !== 'Oro insuficiente' ? blocker : `🪙 ${cost}`}</span>
          </button>
        )}
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
        wallsLevel={state.upgrades.walls || 0}
        now={now}
        selectedUid={selectedUid}
        moving={moving}
        kingdom={state.playerKingdom}
        garrison={state.garrison}
        troops={state.troops}
        onSelect={setSelectedUid}
        onMoveTo={onMoveTo}
        onCollect={collect}
        onWallClick={handleWallClick}
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
