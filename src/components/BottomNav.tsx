import type { ViewType } from '../App';

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  badges?: Partial<Record<ViewType, number>>;
}

const NAV_ITEMS: { id: ViewType; icon: string; label: string }[] = [
  { id: 'home', icon: '🏰', label: 'Aldea' },
  { id: 'map', icon: '🗺️', label: 'Mapa' },
  { id: 'pvp', icon: '⚔️', label: 'Guerra' },
  { id: 'quests', icon: '📜', label: 'Misiones' },
  { id: 'store', icon: '💎', label: 'Tienda' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange, badges = {} }) => {
  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
        >
          <span className="nav-icon" style={{ position: 'relative' }}>
            {item.icon}
            {(badges[item.id] || 0) > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-10px', minWidth: '16px', height: '16px', borderRadius: '8px',
                background: 'var(--accent-danger)', color: '#fff', fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
              }}>{badges[item.id]}</span>
            )}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
