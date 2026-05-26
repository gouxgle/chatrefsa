import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import refsaLogo from '../assets/refsa-mark-transparent.png';
import './Auth.css';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || 'Si tu correo está registrado, recibirás un enlace de recuperación.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud de recuperación');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel
        tagline="Recuperar acceso"
        headline="¿Olvidaste tu contraseña? Te ayudamos."
        sub="Te enviamos un código a tu correo corporativo para que puedas restablecer tu acceso al chat REFSA."
      />

      <main className="auth-form-panel">
        <div className="auth-container slide-up">
          <div className="auth-header">
            <div className="auth-logo"><img src={refsaLogo} alt="REFSA" /></div>
            <h1>Recuperar contraseña</h1>
            <p>Ingresá tu correo y te enviaremos un código de recuperación.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div className="auth-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', padding: '1.25rem' }}>
              <CheckCircle size={28} />
              <div>{success}</div>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>Correo electrónico</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input type="email" className="input" placeholder="tu@empresa.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : <><span>Enviar código</span><ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <Link to="/reset-password" className="btn btn-primary w-full auth-submit" style={{ textDecoration: 'none', marginTop: '0.5rem' }}>
              <span>Ingresar código</span>
              <ArrowRight size={18} />
            </Link>
          )}

          <div className="auth-footer">
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
