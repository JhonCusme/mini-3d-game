import { useState, useMemo, useRef, type MouseEvent } from 'react';
import { useGame } from '../core/GameContext';
import type { AvatarType, KingdomType } from '../core/GameState';
import { EffectManager } from '../core/EffectManager';
import { KINGDOMS_CONFIG } from '../config/KingdomsConfig';

const AVATARS: { id: AvatarType; icon: string; name: string }[] = [
  { id: 'warrior', icon: '/assets/heroes/warrior.jpg', name: 'Guerrero' },
  { id: 'mage', icon: '/assets/heroes/mage.jpg', name: 'Mago' },
  { id: 'archer', icon: '/assets/heroes/archer.jpg', name: 'Arquera' },
  { id: 'paladin', icon: '/assets/heroes/paladin.jpg', name: 'Paladín' },
  { id: 'rogue', icon: '/assets/heroes/rogue.jpg', name: 'Pícaro' },
  { id: 'druid', icon: '/assets/heroes/druid.jpg', name: 'Druida' },
];

const KINGDOMS: { id: KingdomType; icon: string; name: string; desc: string }[] = [
  { id: 'emerald', icon: '🌲', name: 'Bosque Esmeralda', desc: 'Paz y naturaleza' },
  { id: 'golden', icon: '🏜️', name: 'Desierto Dorado', desc: 'Riqueza y poder' },
  { id: 'frost', icon: '🏔️', name: 'Montaña de Hielo', desc: 'Fuerza y resistencia' },
];

const TiltCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -20;
    const rotateY = ((x - centerX) / centerX) * 20;
    
    // Add dynamic lighting/glare
    
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.1)`,
      transition: 'none',
      zIndex: 10,
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)',
      zIndex: 1,
    });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, display: 'flex', justifyContent: 'center', position: 'relative' }}
    >
      {children}
    </div>
  );
};

export const CharacterCreation: React.FC = () => {
  const { completeSetup } = useGame();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<AvatarType>('warrior');
  const [kingdom, setKingdom] = useState<KingdomType>('emerald');

  const handleComplete = () => {
    if (!name.trim()) return;
    EffectManager.fireVictoryConfetti();
    completeSetup(name.trim(), avatar, kingdom);
  };

  const canGoNext = () => {
    if (step === 0) return true;
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return true;
    return true;
  };

  const particles = useMemo(() => Array.from({ length: 20 }, () => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 5}s`,
    size: `${2 + Math.random() * 4}px`,
  })), []);

  return (
    <div className="creation-screen">
      {/* Floating particles */}
      <div className="particles">
        {particles.map((p, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>

      {/* Step 0: Choose Avatar */}
      {step === 0 && (
        <div className="flex-col gap-4 animate-pop" style={{ alignItems: 'center', width: '100%' }}>
          <h1 className="title-clash" style={{ fontSize: '28px', color: 'var(--accent-gold)', textShadow: '0 2px 10px rgba(255,215,0,0.3)' }}>
            ¡Crea tu Héroe!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px' }}>
            Elige tu clase de guerrero
          </p>

          <div className="avatar-grid">
            {AVATARS.map(a => (
              <TiltCard key={a.id}>
                <div
                  className={`avatar-option ${avatar === a.id ? 'selected' : ''}`}
                  onClick={() => setAvatar(a.id)}
                  style={{ width: '100%', padding: '12px 8px' }}
                >
                  <img src={a.icon} alt={a.name} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.6)' }} />
                  <span className="avatar-label" style={{ fontSize: '13px', marginTop: '4px' }}>{a.name}</span>
                </div>
              </TiltCard>
            ))}
          </div>

          <button
            className="btn-upgrade"
            onClick={() => setStep(1)}
            style={{ width: '100%', maxWidth: '300px', marginTop: '12px', fontSize: '16px', padding: '14px' }}
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Step 1: Enter Name */}
      {step === 1 && (
        <div className="flex-col gap-4 animate-pop" style={{ alignItems: 'center', width: '100%' }}>
          <div style={{ marginBottom: '8px' }}>
            <img src={AVATARS.find(a => a.id === avatar)?.icon} alt="Avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-gold)' }} />
          </div>
          <h1 className="title-clash" style={{ fontSize: '24px', color: 'var(--accent-gold)' }}>
            ¿Cómo te llamas?
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Dale un nombre a tu héroe
          </p>

          <input
            className="creation-input"
            type="text"
            placeholder="Tu nombre..."
            value={name}
            onChange={e => setName(e.target.value.slice(0, 16))}
            maxLength={16}
            autoFocus
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{name.length}/16</span>

          <div className="flex-row gap-2" style={{ width: '100%', maxWidth: '300px' }}>
            <button
              className="btn-primary"
              onClick={() => setStep(0)}
              style={{ flex: 1, padding: '14px' }}
            >
              ← Atrás
            </button>
            <button
              className="btn-upgrade"
              onClick={() => setStep(2)}
              disabled={!canGoNext()}
              style={{ flex: 2, padding: '14px', fontSize: '16px' }}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Choose Kingdom */}
      {step === 2 && (
        <div className="flex-col gap-3 animate-pop" style={{ alignItems: 'center', width: '100%', maxWidth: '440px' }}>
          <h1 className="title-clash" style={{ fontSize: '24px', color: 'var(--accent-gold)' }}>
            Elige tu Reino
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center' }}>
            Cada reino define el paisaje 3D de tu aldea y te otorga bendiciones exclusivas
          </p>

          <div className="kingdom-grid" style={{ width: '100%' }}>
            {KINGDOMS.map(k => (
              <div
                key={k.id}
                className={`kingdom-option ${k.id} ${kingdom === k.id ? 'selected' : ''}`}
                onClick={() => setKingdom(k.id)}
              >
                <span className="kingdom-icon">{k.icon}</span>
                <span className="kingdom-name">{k.name}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{k.desc}</span>
              </div>
            ))}
          </div>

          {/* Active Kingdom Perk Card */}
          {(() => {
            const currentKingdom = KINGDOMS_CONFIG[kingdom];
            return (
              <div
                className="glass-panel animate-pop flex-col gap-2"
                style={{
                  width: '100%',
                  border: '2px solid rgba(255, 215, 0, 0.4)',
                  padding: '12px 14px',
                  background: 'rgba(20, 10, 40, 0.85)',
                }}
              >
                <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
                  <div className="flex-row gap-2" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '24px' }}>{currentKingdom.icon}</span>
                    <div className="flex-col">
                      <b style={{ color: 'var(--accent-gold)', fontSize: '14px' }}>{currentKingdom.name}</b>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{currentKingdom.subtitle}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#7bed9f', fontWeight: 700 }}>
                    {kingdom === 'frost' ? '❄️ Cordillera de Hielo' : kingdom === 'golden' ? '🏜️ Dunas Doradas' : '🌲 Bosque Ancestral'}
                  </span>
                </div>

                <div className="flex-col gap-1" style={{ marginTop: '4px' }}>
                  {currentKingdom.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        padding: '6px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <div className="flex-row justify-between" style={{ alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                          {attr.icon} {attr.title}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#ffd700',
                            background: 'rgba(255, 215, 0, 0.15)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}
                        >
                          {attr.highlight}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {attr.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="flex-row gap-2" style={{ width: '100%', maxWidth: '340px', marginTop: '4px' }}>
            <button
              className="btn-primary"
              onClick={() => setStep(1)}
              style={{ flex: 1, padding: '12px' }}
            >
              ← Atrás
            </button>
            <button
              className="btn-upgrade"
              onClick={handleComplete}
              disabled={!canGoNext()}
              style={{ flex: 2, padding: '12px', fontSize: '15px' }}
            >
              ⚔️ ¡Fundar Reino!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
