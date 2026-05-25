import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, ShieldCheck, Key, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function VerifyEmail() {
  const { verifyEmail, resendVerification, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [emailForResend, setEmailForResend] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifyingAuto, setVerifyingAuto] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      handleAutoVerify(urlToken);
    }
  }, [searchParams]);

  const handleAutoVerify = async (urlToken) => {
    setError('');
    setSuccess('');
    setVerifyingAuto(true);
    try {
      const res = await verifyEmail(urlToken);
      setSuccess(res.message || 'Cuenta verificada con éxito.');
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace de verificación es inválido o ha expirado.');
    } finally {
      setVerifyingAuto(false);
    }
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await verifyEmail(token);
      setSuccess(res.message || 'Cuenta verificada con éxito.');
    } catch (err) {
      setError(err.response?.data?.error || 'Token de verificación inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const targetEmail = emailForResend || user?.email;
    if (!targetEmail) {
      return setError('Por favor, ingresa tu correo electrónico para reenviar la verificación.');
    }

    setLoading(true);
    try {
      const res = await resendVerification(targetEmail);
      setSuccess(res.message || 'Se ha reenviado el correo de verificación.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar la verificación.');
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
          <h1>Verificación de Correo</h1>
          <p>Verifica tu cuenta para chatear con tus compañeros</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && (
          <div className="auth-success" style={{ background: 'rgba(0, 168, 132, 0.1)', border: '1px solid var(--accent)', color: '#00a884', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem' }}>
            <CheckCircle size={32} />
            <div style={{ fontSize: '0.875rem' }}>{success}</div>
          </div>
        )}

        {verifyingAuto ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
            <div className="spinner" />
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verificando tu cuenta automáticamente...</div>
          </div>
        ) : !success ? (
          <div style={{ width: '100%' }}>
            <form onSubmit={handleSubmitManual} className="auth-form" style={{ marginBottom: '2rem' }}>
              <div className="input-group">
                <label>Token de Verificación</label>
                <div className="input-icon-wrapper">
                  <Key size={18} className="input-icon" />
                  <input type="text" className="input" placeholder="Ingresa tu token de verificación" value={token} onChange={e => setToken(e.target.value)} required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : <><span>Verificar Cuenta</span><ShieldCheck size={18} /></>}
              </button>
            </form>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', width: '100%' }}>
              <h3 style={{ fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>¿No recibiste el correo?</h3>
              <form onSubmit={handleResend} className="auth-form">
                {!user && (
                  <div className="input-group" style={{ marginBottom: '0.75rem' }}>
                    <label>Tu Correo Electrónico</label>
                    <input type="email" className="input" placeholder="tu@empresa.com" value={emailForResend} onChange={e => setEmailForResend(e.target.value)} required />
                  </div>
                )}
                <button type="submit" className="btn btn-ghost w-full" style={{ fontSize: '0.8125rem', height: '40px' }} disabled={loading}>
                  {loading ? 'Reenviando...' : 'Reenviar Código de Verificación'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate('/')} className="btn btn-primary w-full auth-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span>Ir al Chat REFSA</span>
            <ArrowRight size={18} />
          </button>
        )}

        <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
