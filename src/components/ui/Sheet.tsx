import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/** Full-height panel over the village, like the menus in Clash of Clans. */
export const Sheet: React.FC<{ title: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) =>
  createPortal(
    <div className="sheet-overlay" onClick={onClose}>
      <div className={`sheet animate-pop ${wide ? 'sheet-wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="sheet-header">
          <h2 className="title-clash">{title}</h2>
          <button className="sheet-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
