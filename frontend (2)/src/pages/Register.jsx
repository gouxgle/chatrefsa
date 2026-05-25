import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Mail, Lock, User, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', confirmEmail: '', username: '', password: '', fullName: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // If either email field is filled, ensure they match
    if ((form.email || form.confirmEmail) && form.email !== form.confirmEmail) {
      setError('Los correos electrónicos no coinciden');
      return;
    }
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await register(form.email, form.confirmEmail, form.username, form.password, form.fullName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Error en el registro');
    } finally { setLoading(false); }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-container slide-up">
        <div className="auth-header">
          <div className="auth-logo"><MessageCircle size={36} /></div>
          <h1>Crear Cuenta</h1>
          <p>Únete al equipo de comunicación interna</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label>Nombre completo</label>
            <div className="input-icon-wrapper">
              <User size={18} className="input-icon" />
              <input className="input" placeholder="Juan Pérez" value={form.fullName} onChange={update('fullName')} required />
            </div>
          </div>
          <div className="input-group">
            <label>Nombre de usuario</label>
            <div className="input-icon-wrapper">
              <UserPlus size={18} className="input-icon" />
              <input className="input" placeholder="juan.perez" value={form.username} onChange={update('username')} required minLength={3} />
            </div>
          </div>
          <div className="input-group">
            <label>Correo electrónico</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input type="email" className="input" placeholder="juan@empresa.com" value={form.email} onChange={update('email')} />
            </div>
          </div>
          <div className="input-group">
            <label>Confirmar correo electrónico</label>
            <div className="input-icon-wrapper">
              <Mail size={18} className="input-icon" />
              <input type="email" className="input" placeholder="juan@empresa.com" value={form.confirmEmail} onChange={update('confirmEmail')} />
            </div>
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <div className="input-icon-wrapper">
              <Lock size={18} className="input-icon" />
              <input type={showPass ? 'text' : 'password'} className="input" placeholder="Mínimo 6 caracteres" value={form.password} onChange={update('password')} required minLength={6} />
              <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full auth-submit" disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : <><span>Crear Cuenta</span><ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes cuenta? <Link to="/login">Iniciar Sesión</Link>
        </div>
      </div>
    </div>
  );
}
