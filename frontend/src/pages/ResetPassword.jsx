import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Key, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import refsaLogo from '../assets/refsa-mark-transparent.png';
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
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) return setError('Las contraseñas no coinciden');
    if (newPassword.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    try {
      const res = await resetPassword(token, newPassword);
      setSuccess(res.message || 'Contraseña cambiada con éxito.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña. El código puede ser inválido o haber expirado.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel
        tagline="Nueva contraseña"
        headline="Definí una contraseña nueva y segura."
        sub="Usá al menos 6 caracteres. Te recomendamos combinar mayúsculas, números y símbolos."
      />

      <main className="auth-form-panel">
        <div className="auth-container slide-up">
          <div className="auth-header">
            <div className="auth-logo"><img src={refsaLogo} alt="REFSA" /></div>
            <h1>Restablecer contraseña</h1>
            <p>Ingresá tu token y tu nueva contraseña empresarial.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div className="auth-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', padding: '1.25rem' }}>
              <CheckCircle size={28} />
              <div>{success}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Redirigiendo al inicio de sesión…</div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label>Token de recuperación</label>
                <div className="input-icon-wrapper">
                  <Key size={18} className="input-icon" />
                  <input type="text" className="input" placeholder="Ingresá tu token" value={token} onChange={e => setToken(e.target.value)} required disabled={!!searchParams.get('token')} />
                </div>
              </div>

              <div className="input-group">
                <label>Nueva contraseña</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input type={showPass ? 'text' : 'password'} className="input" placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                  <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)} aria-label="Mostrar/ocultar contraseña">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label>Confirmar nueva contraseña</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input type={showPass ? 'text' : 'password'} className="input" placeholder="Repetí tu contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : <><span>Cambiar contraseña</span><ArrowRight size={18} /></>}
              </button>
            </form>
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
