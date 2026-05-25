import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MessageSquare, HardDrive, Activity, Shield, Ban, Trash2, UserCheck } from 'lucide-react';
import api from '../../api/axios';
import '../Chat.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);
  // States for Audit Tab
  const [messages, setMessages] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' });

  // Input states for filters
  const [searchVal, setSearchVal] = useState('');
  const [senderVal, setSenderVal] = useState('');
  const [dateFromVal, setDateFromVal] = useState('');
  const [dateToVal, setDateToVal] = useState('');

  // Applied filter states
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSenderId, setFilterSenderId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, u, l] = await Promise.all([
          api.get('/admin/stats'), api.get('/admin/users?limit=200'), api.get('/admin/logs?limit=30')
        ]);
        setStats(s.data.stats); setUsers(u.data.users); setLogs(l.data.logs);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const fetchAuditMessages = async () => {
    setAuditLoading(true);
    try {
      const params = {
        page: auditPage,
        limit: 50,
      };
      if (filterSearch) params.search = filterSearch;
      if (filterSenderId) params.senderId = filterSenderId;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;

      const res = await api.get('/admin/messages', { params });
      setMessages(res.data.messages || []);
      setAuditTotal(res.data.total || 0);
      setAuditTotalPages(res.data.totalPages || 1);
    } catch {
      /* ignore */
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'audit') {
      fetchAuditMessages();
    }
  }, [tab, auditPage, filterSearch, filterSenderId, filterDateFrom, filterDateTo]);

  const handleSearch = () => {
    setFilterSearch(searchVal);
    setFilterSenderId(senderVal);
    setFilterDateFrom(dateFromVal);
    setFilterDateTo(dateToVal);
    setAuditPage(1);
  };

  const handleReset = () => {
    setSearchVal('');
    setSenderVal('');
    setDateFromVal('');
    setDateToVal('');
    setFilterSearch('');
    setFilterSenderId('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setAuditPage(1);
  };

  const toggleBlock = async (id, blocked) => {
    try {
      await api.put(`/admin/users/${id}/block`, { blocked: !blocked });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: !blocked } : u));
    } catch { /* ignore */ }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try { await api.delete(`/admin/users/${id}`); setUsers(prev => prev.filter(u => u.id !== id)); } catch { /* ignore */ }
  };

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    } catch { /* ignore */ }
  };

  const handleNewUserChange = (field) => (e) => {
    setNewUser({ ...newUser, [field]: e.target.value });
  };

  const submitNewUser = async () => {
    try {
      const created = await api.post('/admin/users', newUser);
      // Update users list
      setUsers(prev => [...prev, created.data.user]);
      setShowUserModal(false);
      setNewUser({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' });
    } catch (err) {
      console.error('Error creating user', err);
      alert(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const cards = [
    { icon: <Users size={22} />, label: 'Usuarios', value: stats?.totalUsers || 0, color: '#00a884' },
    { icon: <Activity size={22} />, label: 'En línea', value: stats?.onlineUsers || 0, color: '#25d366' },
    { icon: <MessageSquare size={22} />, label: 'Mensajes', value: stats?.totalMessages || 0, color: '#0088cc' },
    { icon: <MessageSquare size={22} />, label: 'Hoy', value: stats?.messagesToday || 0, color: '#f59e0b' },
    { icon: <Users size={22} />, label: 'Grupos', value: stats?.totalGroups || 0, color: '#8b5cf6' },
    { icon: <HardDrive size={22} />, label: 'Almacenamiento', value: stats?.storage?.total || '0 B', color: '#ec4899' },
  ];

  const tabs = [
    { id: 'stats', label: '📊 Estadísticas' },
    { id: 'users', label: '👥 Usuarios' },
    { id: 'logs', label: '📋 Logs' },
    { id: 'audit', label: '💬 Auditoría de Chats' },
  ];

  return (
    <div className="admin-page">
      <div className="chat-header">
        <button className="btn-icon" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
        <Shield size={20} style={{ color: 'var(--accent)' }} />
        <div className="chat-header-info"><div className="chat-header-name">Panel de Administración</div></div>
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem 1rem', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`btn ${tab === t.id ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '0.8125rem' }}>{t.label}</button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'stats' && (
          <>
            <div className="admin-grid">
              {cards.map((c, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-card-icon" style={{ background: `${c.color}15`, color: c.color }}>{c.icon}</div>
                  <div className="stat-card-value">{c.value}</div>
                  <div className="stat-card-label">{c.label}</div>
                </div>
              ))}
            </div>
            <div className="admin-section">
              <h3>📈 Almacenamiento por categoría</h3>
              {stats?.storage?.categories && Object.entries(stats.storage.categories).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.875rem' }}>
                  <span style={{ textTransform: 'capitalize' }}>{k}</span><span style={{ color: 'var(--text-secondary)' }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="admin-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Gestión de Usuarios ({users.length})</h3>
              <button className="btn btn-primary" onClick={() => setShowUserModal(true)}>➕ Crear Usuario</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead><tr><th>Usuario</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><div className="flex items-center gap-2"><div className="avatar avatar-sm"><span>{(u.fullName || 'U')[0]}</span>{u.isOnline && <span className="online-dot online" />}</div><span>{u.fullName || u.username}</span></div></td>
                      <td>{u.email || <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin email</span>}</td>
                      <td>
                        <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.25rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                          <option value="EMPLOYEE">Empleado</option><option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td>{u.isBlocked ? <span style={{ color: 'var(--danger)' }}>Bloqueado</span> : <span style={{ color: 'var(--online)' }}>Activo</span>}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-icon" onClick={() => toggleBlock(u.id, u.isBlocked)} title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}>{u.isBlocked ? <UserCheck size={16} /> : <Ban size={16} />}</button>
                          <button className="btn-icon" onClick={() => deleteUser(u.id)} title="Eliminar" style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Crear Usuario */}
        {showUserModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--bg-primary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '420px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>➕ Crear nuevo usuario</h3>
              <div className="input-group">
                <label>Nombre de usuario *</label>
                <input className="input" value={newUser.username} onChange={handleNewUserChange('username')} placeholder="juan.perez" />
              </div>
              <div className="input-group">
                <label>Contraseña *</label>
                <input type="password" className="input" value={newUser.password} onChange={handleNewUserChange('password')} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="input-group">
                <label>Nombre completo</label>
                <input className="input" value={newUser.fullName} onChange={handleNewUserChange('fullName')} placeholder="Juan Pérez" />
              </div>
              <div className="input-group">
                <label>Correo electrónico <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>(opcional)</span></label>
                <input className="input" value={newUser.email} onChange={handleNewUserChange('email')} placeholder="juan@refsa.com" />
              </div>
              <div className="input-group">
                <label>Rol</label>
                <select className="input" value={newUser.role} onChange={handleNewUserChange('role')}>
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button className="btn btn-ghost" onClick={() => { setShowUserModal(false); setNewUser({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' }); }}>Cancelar</button>
                <button className="btn btn-primary" onClick={submitNewUser}>Crear usuario</button>
              </div>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="admin-section">
            <h3>Logs del Sistema</h3>
            <table className="admin-table">
              <thead><tr><th>Acción</th><th>Usuario</th><th>Detalles</th><th>Fecha</th></tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id}>
                    <td><span className="badge badge-primary" style={{ fontSize: '0.625rem' }}>{l.action}</span></td>
                    <td>{l.user?.fullName || l.user?.email || '-'}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || '-'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(l.createdAt).toLocaleString('es')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'audit' && (
          <div className="admin-section">
            <h3>Auditoría de Historial de Chats</h3>
            
            {/* Filters panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Palabra clave</label>
                <input
                  type="text"
                  className="input"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                  placeholder="Buscar texto..."
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Remitente</label>
                <select
                  className="input"
                  style={{ height: '36px', fontSize: '0.8125rem', padding: '0 0.5rem', background: 'var(--bg-input)' }}
                  value={senderVal}
                  onChange={e => setSenderVal(e.target.value)}
                >
                  <option value="">Todos los empleados</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.username} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Desde fecha</label>
                <input
                  type="date"
                  className="input"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                  value={dateFromVal}
                  onChange={e => setDateFromVal(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Hasta fecha</label>
                <input
                  type="date"
                  className="input"
                  style={{ height: '36px', fontSize: '0.8125rem' }}
                  value={dateToVal}
                  onChange={e => setDateToVal(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', gridColumn: '1 / -1', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" onClick={handleReset} style={{ fontSize: '0.8125rem', height: '36px' }}>Restablecer</button>
                <button className="btn btn-primary" onClick={handleSearch} style={{ fontSize: '0.8125rem', height: '36px' }}>🔍 Buscar</button>
              </div>
            </div>

            {/* Results table */}
            {auditLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>No se encontraron mensajes que coincidan con la búsqueda.</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Emisor</th>
                        <th>Sala / Conversación</th>
                        <th>Tipo</th>
                        <th>Mensaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messages.map(m => {
                        const isGroup = m.conversation?.isGroup;
                        const roomName = isGroup 
                          ? m.conversation?.name 
                          : `Chat Privado`;
                        
                        let displayContent = m.content;
                        if (m.type === 'IMAGE') displayContent = '📷 Imagen';
                        if (m.type === 'DOCUMENT') displayContent = '📄 Archivo / Documento';
                        if (m.type === 'VIDEO') displayContent = '🎥 Video';
                        if (m.type === 'AUDIO') displayContent = '🎵 Audio';

                        return (
                          <tr key={m.id}>
                            <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{new Date(m.createdAt).toLocaleString('es')}</td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '500' }}>{m.sender?.fullName || m.sender?.username}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.sender?.email}</span>
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <span className={`badge ${isGroup ? 'badge-primary' : 'badge-ghost'}`} style={{ fontSize: '0.75rem' }}>
                                {roomName}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--accent)' }}>{m.type}</span>
                            </td>
                            <td style={{ maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }} title={m.content}>
                              {displayContent}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Total: <strong>{auditTotal}</strong> mensajes (Pág {auditPage} de {auditTotalPages})</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', height: '32px' }}
                      disabled={auditPage === 1}
                      onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                    >
                      Anterior
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '0.75rem', height: '32px' }}
                      disabled={auditPage >= auditTotalPages}
                      onClick={() => setAuditPage(prev => prev + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
