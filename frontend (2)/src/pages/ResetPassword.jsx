import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Key, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }

    if (newPassword.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, newPassword);
      setSuccess(res.message || 'Contraseña cambiada con éxito.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña. El código puede ser inválido o haber expirado.');
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
          <h1>Restablecer Contraseña</h1>
          <p>Ingresa tu token y tu nueva contraseña empresarial</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success" style={{ background: 'rgba(0, 168, 132, 0.1)', border: '1px solid var(--accent)', color: '#00a884', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <CheckCircle size={32} />
            <div style={{ fontSize: '0.875rem' }}>{success}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Redirigiendo al inicio de sesión...</div>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Token de recuperación</label>
              <div className="input-icon-wrapper">
                <Key size={18} className="input-icon" />
                <input type="text" className="input" placeholder="Ingresa tu token" value={token} onChange={e => setToken(e.target.value)} required disabled={!!searchParams.get('token')} />
              </div>
            </div>

            <div className="input-group">
              <label>Nueva Contraseña</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label>Confirmar Nueva Contraseña</label>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="Repite tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : <><span>Cambiar Contraseña</span><ArrowRight size={18} /></>}
            </button>
          </form>
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
