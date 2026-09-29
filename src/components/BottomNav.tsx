type ViewType = 'home' | 'map' | 'quests' | 'store' | 'settings';

interface BottomNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const NAV_ITEMS: { id: ViewType; icon: string; label: string }[] = [
  { id: 'home', icon: '🏰', label: 'Aldea' },
  { id: 'map', icon: '🗺️', label: 'Mapa' },
  { id: 'quests', icon: '📜', label: 'Misiones' },
  { id: 'store', icon: '💎', label: 'Tienda' },
  { id: 'settings', icon: '⚙️', label: 'Ajustes' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};
