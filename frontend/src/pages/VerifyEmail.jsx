import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Key, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import refsaLogo from '../assets/refsa-mark-transparent.png';
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
    if (urlToken) handleAutoVerify(urlToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleAutoVerify = async (urlToken) => {
    setError(''); setSuccess(''); setVerifyingAuto(true);
    try {
      const res = await verifyEmail(urlToken);
      setSuccess(res.message || 'Cuenta verificada con éxito.');
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace de verificación es inválido o ha expirado.');
    } finally { setVerifyingAuto(false); }
  };

  const handleSubmitManual = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await verifyEmail(token);
      setSuccess(res.message || 'Cuenta verificada con éxito.');
    } catch (err) {
      setError(err.response?.data?.error || 'Token de verificación inválido o expirado.');
    } finally { setLoading(false); }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const targetEmail = emailForResend || user?.email;
    if (!targetEmail) return setError('Por favor, ingresá tu correo electrónico para reenviar la verificación.');
    setLoading(true);
    try {
      const res = await resendVerification(targetEmail);
      setSuccess(res.message || 'Se ha reenviado el correo de verificación.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al reenviar la verificación.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel
        tagline="Verificación de cuenta"
        headline="Confirmá tu correo para activar tu cuenta."
        sub="Por seguridad, antes de habilitar todas las funciones necesitamos verificar tu correo corporativo."
      />

      <main className="auth-form-panel">
        <div className="auth-container slide-up">
          <div className="auth-header">
            <div className="auth-logo"><img src={refsaLogo} alt="REFSA" /></div>
            <h1>Verificación de correo</h1>
            <p>Ingresá el token que recibiste por mail o reenvialo si lo perdiste.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && (
            <div className="auth-success" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.5rem', padding: '1.25rem' }}>
              <CheckCircle size={28} />
              <div>{success}</div>
            </div>
          )}

          {verifyingAuto ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
              <div className="spinner" />
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Verificando tu cuenta automáticamente…</div>
            </div>
          ) : !success ? (
            <>
              <form onSubmit={handleSubmitManual} className="auth-form">
                <div className="input-group">
                  <label>Token de verificación</label>
                  <div className="input-icon-wrapper">
                    <Key size={18} className="input-icon" />
                    <input type="text" className="input" placeholder="Pegá tu token aquí" value={token} onChange={e => setToken(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
                  {loading ? <span className="spinner spinner-sm" /> : <><span>Verificar cuenta</span><ShieldCheck size={18} /></>}
                </button>
              </form>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.875rem', marginBottom: '0.75rem', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>¿No recibiste el correo?</h3>
                <form onSubmit={handleResend} className="auth-form">
                  {!user && (
                    <div className="input-group">
                      <label>Tu correo electrónico</label>
                      <input type="email" className="input" placeholder="tu@empresa.com" value={emailForResend} onChange={e => setEmailForResend(e.target.value)} required />
                    </div>
                  )}
                  <button type="submit" className="btn btn-secondary w-full" style={{ height: '42px' }} disabled={loading}>
                    {loading ? 'Reenviando…' : 'Reenviar código de verificación'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <button onClick={() => navigate('/')} className="btn btn-primary w-full auth-submit">
              <span>Ir al chat REFSA</span>
              <ArrowRight size={18} />
            </button>
          )}

          <div className="auth-footer">
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
