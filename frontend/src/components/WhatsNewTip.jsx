import { useState, useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

const STORAGE_KEY = 'refsa-chat:whatsnew-v2-dismissed';

/**
 * Banner sutil de "Nueva versión" que aparece la primera vez que el
 * usuario entra al chat después del rediseño. Se descarta para siempre
 * usando localStorage.
 */
export default function WhatsNewTip() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Mostrarlo después de un beat para que no compita con la carga inicial
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  const dismiss = () => {
    setOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  if (!open) return null;

  return (
    <div className="whatsnew-tip" role="dialog" aria-label="Novedades">
      <div className="whatsnew-tip-head">
        <div className="whatsnew-tip-eyebrow">Novedades · v2.0</div>
        <div className="whatsnew-tip-title">
          <Sparkles size={16} style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: '-3px' }} />
          Nuevo aspecto, mismo chat
        </div>
      </div>
      <div className="whatsnew-tip-body">
        Refrescamos el diseño de REFSA Chat con un look más empresarial:
        <ul>
          <li>Identidad visual REFSA en login, sidebar y empty states.</li>
          <li>Modo claro y oscuro, con densidad ajustable desde la barra superior.</li>
          <li>Panel de información de grupo con miembros, multimedia y configuración.</li>
          <li>Perfil rediseñado y panel de administración más completo.</li>
        </ul>
      </div>
      <div className="whatsnew-tip-foot">
        <button className="btn btn-secondary" onClick={dismiss} style={{ height: 32, padding: '0 0.75rem', fontSize: '0.75rem' }}>Entendido</button>
      </div>
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}
