import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Camera, Save } from 'lucide-react';
import api, { API_URL } from '../api/axios';
import './Chat.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState({ fullName: user?.fullName || '', username: user?.username || '', customStatus: user?.customStatus || '' });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '' });
  const [status, setStatus] = useState(user?.status || 'AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setLoading(true); setMsg('');
    try {
      await api.put('/users/profile', form);
      await api.put('/users/status', { status });
      updateUser({ ...form, status });
      setMsg('✅ Perfil actualizado');
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
    finally { setLoading(false); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const { data } = await api.put('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar: data.user.avatar });
      setMsg('✅ Foto actualizada');
    } catch { setMsg('❌ Error al subir foto'); }
  };

  const handlePassword = async () => {
    if (passForm.newPassword.length < 6) { setMsg('❌ Mínimo 6 caracteres'); return; }
    try {
      await api.put('/users/password', passForm);
      setPassForm({ currentPassword: '', newPassword: '' });
      setMsg('✅ Contraseña actualizada');
    } catch (err) { setMsg('❌ ' + (err.response?.data?.error || 'Error')); }
  };

  const statuses = [
    { value: 'AVAILABLE', label: '🟢 Disponible' },
    { value: 'BUSY', label: '🟡 Ocupado' },
    { value: 'AWAY', label: '⚪ Ausente' },
    { value: 'DO_NOT_DISTURB', label: '🔴 No molestar' },
  ];

  return (
    <div className="profile-page">
      <div className="chat-header">
        <button className="btn-icon" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
        <div className="chat-header-info"><div className="chat-header-name">Mi Perfil</div></div>
      </div>
      <div className="profile-content">
        <div className="profile-card slide-up">
          <div className="profile-avatar-section">
            <div className="profile-avatar-upload" onClick={() => fileRef.current?.click()}>
              <div className="avatar avatar-xl">
                {user?.avatar ? <img src={`${API_URL}${user.avatar}`} alt="" /> : <span style={{ fontSize: '2rem' }}>{(user?.fullName || 'U')[0]}</span>}
              </div>
              <div className="profile-avatar-overlay"><Camera size={24} /></div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{user?.fullName}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>

          {msg && <div style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)', background: msg.startsWith('✅') ? 'var(--accent-light)' : 'rgba(234,67,53,0.1)', fontSize: '0.8125rem', textAlign: 'center', marginBottom: '1rem' }}>{msg}</div>}

          <div className="profile-form">
            <div className="input-group"><label>Nombre completo</label><input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div className="input-group"><label>Nombre de usuario</label><input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div className="input-group"><label>Estado personalizado</label><input className="input" value={form.customStatus} onChange={e => setForm({ ...form, customStatus: e.target.value })} placeholder="¿Qué estás haciendo?" /></div>
            <div className="input-group">
              <label>Estado</label>
              <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <button className="btn btn-primary w-full" onClick={handleSave} disabled={loading}><Save size={16} /> Guardar Cambios</button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.5rem 0' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Cambiar Contraseña</div>
            <div className="input-group"><label>Contraseña actual</label><input className="input" type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} /></div>
            <div className="input-group"><label>Nueva contraseña</label><input className="input" type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} /></div>
            <button className="btn btn-secondary w-full" onClick={handlePassword}>Cambiar Contraseña</button>
          </div>
        </div>
      </div>
    </div>
  );
}
