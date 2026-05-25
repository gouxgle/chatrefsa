import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
      <div className="auth-container slide-up">
        <div className="auth-header">
          <div className="auth-logo">
            <MessageCircle size={36} />
          </div>
          <h1>Chat REFSA</h1>
          <p>Inicia sesión en tu cuenta empresarial</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Contraseña</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: '500' }}>¿Olvidaste tu contraseña?</Link>
            </div>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} className="input" placeholder="Tu contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : <><span>Iniciar Sesión</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes cuenta? <Link to="/register">Crear cuenta</Link>
        </div>
      </div>
    </div>
  );
}
