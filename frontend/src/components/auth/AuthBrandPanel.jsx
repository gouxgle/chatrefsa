import refsaLogo from '../../assets/refsa-mark-transparent.png';
import { ShieldCheck, Users, Zap } from 'lucide-react';

/**
 * AuthBrandPanel — Panel izquierdo de marca compartido por las páginas
 * Login / Register / Forgot / Reset / VerifyEmail.
 * Se oculta automáticamente en mobile (CSS @media en Auth.css).
 */
export default function AuthBrandPanel({
  tagline = 'Comunicación interna',
  headline = 'Chat empresarial seguro para todo el equipo REFSA.',
  sub = 'Mensajes en tiempo real, grupos por área, archivos y videoconferencia — todo dentro de la red de la empresa.',
} = {}) {
  return (
    <aside className="auth-brand-panel">
      <header className="auth-brand-top">
        <div className="auth-brand-mark">
          <img src={refsaLogo} alt="REFSA" />
        </div>
        <span className="auth-brand-wordmark">REFSA</span>
      </header>

      <div className="auth-brand-center">
        <div className="auth-brand-tagline">{tagline}</div>
        <h2 className="auth-brand-headline">{headline}</h2>
        <p className="auth-brand-sub">{sub}</p>

        <ul className="auth-brand-features" style={{ listStyle: 'none' }}>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-icon"><ShieldCheck size={16} /></span>
            <span>Cifrado y autenticación corporativa</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-icon"><Users size={16} /></span>
            <span>Grupos por sector, sucursal o proyecto</span>
          </li>
          <li className="auth-brand-feature">
            <span className="auth-brand-feature-icon"><Zap size={16} /></span>
            <span>Notificaciones instantáneas en tiempo real</span>
          </li>
        </ul>
      </div>

      <footer className="auth-brand-footer">
        <span>© REFSA · Recursos y Energía Formosa</span>
        <span>v2.0</span>
      </footer>
    </aside>
  );
}
