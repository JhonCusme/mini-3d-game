import { useGame } from '../core/GameContext';

const AVATAR_ICONS: Record<string, string> = {
  warrior: '/assets/heroes/warrior.jpg',
  mage: '/assets/heroes/mage.jpg',
  archer: '/assets/heroes/archer.jpg',
  paladin: '/assets/heroes/paladin.jpg',
  rogue: '/assets/heroes/rogue.jpg',
  druid: '/assets/heroes/druid.jpg',
};

export const TopBar: React.FC = () => {
  const { state } = useGame();
  const avatarIcon = AVATAR_ICONS[state.playerAvatar] || '👤';

  return (
    <div className="top-bar">
      <div className="player-badge">
        <div className="player-avatar-small" style={{ overflow: 'hidden' }}>
          <img src={avatarIcon} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div className="player-info">
          <span className="player-name">{state.playerName || 'Héroe'}</span>
          <span className="player-level">Nv. {state.level}</span>
        </div>
      </div>
      <div className="flex-row gap-2">
        <div className="resource-capsule energy">
          <span>⚡</span>
          <span>{state.energy}</span>
        </div>
        <div className="resource-capsule gold">
          <span>🪙</span>
          <span>{Math.floor(state.coins)}</span>
        </div>
        <div className="resource-capsule gem">
          <span>💎</span>
          <span>{state.gems}</span>
        </div>
      </div>
    </div>
  );
};
