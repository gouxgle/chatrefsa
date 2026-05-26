import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Camera, Save, Lock, Mail, AtSign, Briefcase, Calendar, ShieldCheck, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api, { API_URL } from '../api/axios';
import './Chat.css';

const STATUSES = [
  { value: 'AVAILABLE',     label: 'Disponible',    dotClass: '' },
  { value: 'BUSY',          label: 'Ocupado',       dotClass: 'busy' },
  { value: 'AWAY',          label: 'Ausente',       dotClass: 'away' },
  { value: 'DO_NOT_DISTURB',label: 'No molestar',   dotClass: 'dnd' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef(null);

  const [tab, setTab] = useState('cuenta');
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    customStatus: user?.customStatus || '',
  });
  const [status, setStatus] = useState(user?.status || 'AVAILABLE');
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusObj = STATUSES.find(s => s.value === status) || STATUSES[0];

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', form);
      await api.put('/users/status', { status });
      updateUser({ ...form, status });
      toast.success('Perfil actualizado', 'Los cambios se guardaron correctamente.');
    } catch (err) {
      toast.error('No se pudo actualizar', err.response?.data?.error || 'Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.put('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar: data.user.avatar });
      toast.success('Foto actualizada', 'Tu nueva foto de perfil ya está visible.');
    } catch {
      toast.error('No se pudo subir la foto', 'Verificá el formato y el tamaño del archivo.');
    }
  };

  const handlePassword = async () => {
    if (passForm.newPassword.length < 6) return toast.error('Contraseña muy corta', 'Debe tener al menos 6 caracteres.');
    if (passForm.newPassword !== passForm.confirmPassword) return toast.error('No coinciden', 'La confirmación no coincide con la nueva contraseña.');
    try {
      await api.put('/users/password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada', 'Tu contraseña se cambió correctamente.');
    } catch (err) {
      toast.error('No se pudo cambiar la contraseña', err.response?.data?.error || 'Verificá la contraseña actual.');
    }
  };

  const initial = (user?.fullName || user?.username || 'U')[0].toUpperCase();
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es', { year: 'numeric', month: 'long' }) : '—';

  return (
    <div className="profile-page-v2">
      <div className="profile-topbar">
        <button className="btn-icon" onClick={() => navigate('/')} aria-label="Volver"><ArrowLeft size={20} /></button>
        <div className="profile-topbar-title">Mi perfil</div>
      </div>

      <div className="profile-scroll">
        <div className="profile-container">
          <div className="profile-hero" />
          <div className="profile-card-v2">
            <div className="profile-hero-row">
              <div className="profile-avatar-xxl" onClick={() => fileRef.current?.click()} role="button" aria-label="Cambiar foto">
                {user?.avatar
                  ? <img src={`${API_URL}${user.avatar}`} alt="" />
                  : <span>{initial}</span>}
                <div className="profile-avatar-camera">
                  <Camera size={22} />
                  <span>Cambiar</span>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />

              <div className="profile-identity">
                <div className="profile-name-line">
                  <span className="profile-display-name">{user?.fullName || user?.username}</span>
                  {user?.role === 'ADMIN' && (
                    <span className="profile-role-badge"><ShieldCheck size={11} /> Administrador</span>
                  )}
                </div>
                <div className="profile-meta-row">
                  {user?.email && <span><Mail size={13} /> {user.email}</span>}
                  {user?.username && <span><AtSign size={13} /> {user.username}</span>}
                  <span><Calendar size={13} /> Miembro desde {memberSince}</span>
                </div>
              </div>

              <div>
                <div className="profile-status-chip" title="Tu estado actual">
                  <span className={`profile-status-dot ${statusObj.dotClass}`} />
                  <span>{statusObj.label}</span>
                </div>
              </div>
            </div>

            <div className="profile-tabs">
              <button className={`profile-tab ${tab === 'cuenta' ? 'active' : ''}`} onClick={() => setTab('cuenta')}>Cuenta</button>
              <button className={`profile-tab ${tab === 'seguridad' ? 'active' : ''}`} onClick={() => setTab('seguridad')}>Seguridad</button>
            </div>

            {tab === 'cuenta' && (
              <>
                <div className="profile-field-grid">
                  <div className="input-group">
                    <label>Nombre completo</label>
                    <input className="input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Tu nombre y apellido" />
                  </div>
                  <div className="input-group">
                    <label>Nombre de usuario</label>
                    <input className="input" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="usuario" />
                  </div>
                  <div className="input-group full">
                    <label>Mensaje de estado</label>
                    <input className="input" value={form.customStatus} onChange={e => setForm({ ...form, customStatus: e.target.value })} placeholder="¿Qué estás haciendo?" />
                  </div>
                  <div className="input-group full">
                    <label>Estado de disponibilidad</label>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {STATUSES.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setStatus(s.value)}
                          className={`profile-status-chip ${status === s.value ? 'active' : ''}`}
                          style={status === s.value ? { borderColor: 'var(--accent)', background: 'var(--accent-light)', color: 'var(--accent)' } : {}}
                        >
                          <span className={`profile-status-dot ${s.dotClass}`} />
                          <span>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="profile-action-row">
                  <button className="btn btn-secondary" onClick={() => navigate('/')} disabled={loading}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                    {loading ? <span className="spinner spinner-sm" /> : <><Save size={16} /> Guardar cambios</>}
                  </button>
                </div>
              </>
            )}

            {tab === 'seguridad' && (
              <>
                <div className="profile-field-grid">
                  <div className="input-group full">
                    <label>Contraseña actual</label>
                    <div className="input-icon-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input className="input" type={showPass ? 'text' : 'password'} value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} placeholder="Ingresá tu contraseña actual" />
                      <button type="button" className="input-icon-right" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Nueva contraseña</label>
                    <div className="input-icon-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input className="input" type={showPass ? 'text' : 'password'} value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Confirmar nueva contraseña</label>
                    <div className="input-icon-wrapper">
                      <Lock size={18} className="input-icon" />
                      <input className="input" type={showPass ? 'text' : 'password'} value={passForm.confirmPassword} onChange={e => setPassForm({ ...passForm, confirmPassword: e.target.value })} placeholder="Repetí la nueva contraseña" />
                    </div>
                  </div>
                </div>

                <div className="profile-action-row">
                  <button className="btn btn-primary" onClick={handlePassword} disabled={!passForm.currentPassword || !passForm.newPassword}>
                    <ShieldCheck size={16} /> Cambiar contraseña
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
