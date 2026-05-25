import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Mail, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      setSuccess(res.message || 'Si tu correo está registrado, recibirás un enlace de recuperación.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageCircle size={36} />
          </div>
          <h1>Recuperar Contraseña</h1>
          <p>Te enviaremos un token para restablecer tu cuenta</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success" style={{ background: 'rgba(0, 168, 132, 0.1)', border: '1px solid var(--accent)', color: '#00a884', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <CheckCircle size={32} />
            <div style={{ fontSize: '0.875rem' }}>{success}</div>
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
              {loading ? <span className="spinner spinner-sm" /> : <><span>Enviar Código</span><ArrowRight size={18} /></>}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', marginBottom: '1rem' }}>
            <Link to="/reset-password" className="btn btn-primary w-full auth-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', gap: '0.5rem', margin: 0 }}>
              <span>Ingresar Código</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
