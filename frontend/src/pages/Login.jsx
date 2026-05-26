import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import AuthBrandPanel from '../components/auth/AuthBrandPanel';
import refsaLogo from '../assets/refsa-mark-transparent.png';
import './Auth.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthBrandPanel
        headline="Conectá con todo tu equipo de REFSA."
        sub="Acceso seguro al chat corporativo. Mensajes, grupos, archivos y videoconferencia dentro de la red de la empresa."
      />

      <main className="auth-form-panel">
        <div className="auth-container slide-up">
          <div className="auth-header">
            <div className="auth-logo"><img src={refsaLogo} alt="REFSA" /></div>
            <h1>Iniciar sesión</h1>
            <p>Ingresá con tu cuenta empresarial para acceder al chat interno.</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="input-group">
              <label>Correo electrónico o usuario</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="text" className="input" placeholder="tu@empresa.com o usuario" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ marginBottom: 0 }}>Contraseña</label>
                <Link to="/forgot-password" style={{ fontSize: '0.75rem', fontWeight: 600 }}>¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} className="input" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)} aria-label="Mostrar/ocultar contraseña">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
              {loading ? <span className="spinner spinner-sm" /> : <><span>Iniciar Sesión</span><ArrowRight size={18} /></>}
            </button>
          </form>

          <div className="auth-footer">
            ¿No tenés cuenta? <Link to="/register">Crear cuenta</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
