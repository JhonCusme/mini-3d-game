import React, { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  onLoaded: () => void;
}

const TIPS = [
  'Asigna tus mejores tropas a la Guarnición para defender tu aldea mientras estás ausente.',
  'Despierta a Tharok en la Campaña para desatar rayos devastadores sobre las defensas enemigas.',
  'Las Catapultas destruyen murallas rápidamente, abriendo paso para la infantería.',
  'Mejora tu Ayuntamiento para desbloquear nuevos niveles de edificios y más defensas.',
  'Los Magos atacan a distancia y vuelan sobre las murallas enemigas.',
  'Inicia sesión con tu cuenta para guardar tu progreso en la nube y no perder tu aldea.',
  'La mina de oro sigue extrayendo tesoros incluso cuando el juego está cerrado.',
];

const ASSETS_TO_PRELOAD = [
  '/assets/heroes/warrior.jpg',
  '/assets/heroes/mage.jpg',
  '/assets/heroes/archer.jpg',
  '/assets/heroes/paladin.jpg',
  '/assets/heroes/rogue.jpg',
  '/assets/heroes/druid.jpg',
  '/assets/village_background.jpg',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando Reino...');
  const [downloadedMB, setDownloadedMB] = useState(0);
  const totalMB = 14.8;
  const [currentTip, setCurrentTip] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const onLoadedRef = useRef(onLoaded);
  onLoadedRef.current = onLoaded;

  // Rotate tips periodically
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 4500);
    return () => clearInterval(tipInterval);
  }, []);

  // Preload assets and simulate authentic download curve
  useEffect(() => {
    // Preload image assets
    ASSETS_TO_PRELOAD.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    let currentPercent = 0;
    const startTime = Date.now();
    const duration = 2800; // ~2.8 seconds loading screen for nice game feel

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const targetPercent = Math.min(100, Math.floor((elapsed / duration) * 100));

      if (currentPercent < targetPercent) {
        currentPercent = targetPercent;
        setProgress(currentPercent);

        const currentMB = Number(((currentPercent / 100) * totalMB).toFixed(1));
        setDownloadedMB(currentMB);

        // Update status text based on progress
        if (currentPercent < 20) {
          setStatusText('Descargando recursos esenciales...');
        } else if (currentPercent < 45) {
          setStatusText('Descargando texturas de héroes y aldea...');
        } else if (currentPercent < 70) {
          setStatusText('Afilando espadas y preparando catapultas...');
        } else if (currentPercent < 90) {
          setStatusText('Conectando con el servidor y los Dioses...');
        } else {
          setStatusText('¡Todo listo para la batalla!');
        }
      }

      if (currentPercent >= 100) {
        clearInterval(interval);
        setIsFinishing(true);
        setTimeout(() => {
          onLoadedRef.current();
        }, 500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`loading-screen ${isFinishing ? 'fade-out' : ''}`}>
      {/* Background mystical particles */}
      <div className="loading-bg-fx">
        <div className="light-beam" />
        <div className="sparkle s1" />
        <div className="sparkle s2" />
        <div className="sparkle s3" />
        <div className="sparkle s4" />
        <div className="sparkle s5" />
      </div>

      <div className="loading-content">
        {/* Emblem & Title */}
        <div className="loading-emblem-wrapper">
          <div className="emblem-glow" />
          <div className="loading-crown">👑</div>
          <h1 className="title-clash loading-title">
            MINI KINGDOM
          </h1>
          <div className="loading-subtitle">
            <span>⚔️</span> ESTRATEGIA Y CONQUISTA <span>⚔️</span>
          </div>
        </div>

        {/* Progress Container */}
        <div className="loading-bar-card">
          <div className="loading-bar-header">
            <span className="loading-status-text">{statusText}</span>
            <span className="loading-percent-text">{progress}%</span>
          </div>

          <div className="loading-progress-track">
            <div
              className="loading-progress-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="shimmer-effect" />
            </div>
          </div>

          <div className="loading-meta-info">
            <span>📦 Paquete v1.0.4</span>
            <span>{downloadedMB.toFixed(1)} MB / {totalMB} MB</span>
          </div>
        </div>

        {/* Clash Style Tip Box */}
        <div className="loading-tip-card">
          <span className="tip-badge">💡 CONSEJO</span>
          <p className="tip-text">"{TIPS[currentTip]}"</p>
        </div>
      </div>
    </div>
  );
};
