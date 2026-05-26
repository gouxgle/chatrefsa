import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, MessageSquare, HardDrive, Activity, Shield, Ban,
  Trash2, UserCheck, BarChart3, ClipboardList, FileSearch, Plus, X,
  Search as SearchIcon, MoreVertical, Image as ImageIcon, FileText,
  Video as VideoIcon, Mic, TrendingUp, ArrowRight, RotateCcw, Inbox
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import '../Chat.css';

const TYPE_ICONS = {
  TEXT:     <MessageSquare size={14} />,
  IMAGE:    <ImageIcon size={14} />,
  DOCUMENT: <FileText size={14} />,
  VIDEO:    <VideoIcon size={14} />,
  AUDIO:    <Mic size={14} />,
};

const formatBytes = (str) => str || '0 B';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(false);

  // Audit
  const [messages, setMessages] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Create user modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' });

  // Filter inputs
  const [searchVal, setSearchVal] = useState('');
  const [senderVal, setSenderVal] = useState('');
  const [dateFromVal, setDateFromVal] = useState('');
  const [dateToVal, setDateToVal] = useState('');

  // Applied filters
  const [filterSearch, setFilterSearch] = useState('');
  const [filterSenderId, setFilterSenderId] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // User search (table)
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [s, u, l] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/users?limit=200'),
          api.get('/admin/logs?limit=30'),
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
      const params = { page: auditPage, limit: 50 };
      if (filterSearch) params.search = filterSearch;
      if (filterSenderId) params.senderId = filterSenderId;
      if (filterDateFrom) params.dateFrom = filterDateFrom;
      if (filterDateTo) params.dateTo = filterDateTo;
      const res = await api.get('/admin/messages', { params });
      setMessages(res.data.messages || []);
      setAuditTotal(res.data.total || 0);
      setAuditTotalPages(res.data.totalPages || 1);
    } catch { /* ignore */ }
    finally { setAuditLoading(false); }
  };

  useEffect(() => {
    if (tab === 'audit') fetchAuditMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, auditPage, filterSearch, filterSenderId, filterDateFrom, filterDateTo]);

  const handleSearch = () => {
    setFilterSearch(searchVal);
    setFilterSenderId(senderVal);
    setFilterDateFrom(dateFromVal);
    setFilterDateTo(dateToVal);
    setAuditPage(1);
  };

  const handleReset = () => {
    setSearchVal(''); setSenderVal(''); setDateFromVal(''); setDateToVal('');
    setFilterSearch(''); setFilterSenderId(''); setFilterDateFrom(''); setFilterDateTo('');
    setAuditPage(1);
  };

  const toggleBlock = async (id, blocked) => {
    try {
      await api.put(`/admin/users/${id}/block`, { blocked: !blocked });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isBlocked: !blocked } : u));
      toast.success(blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado');
    } catch (err) { toast.error('No se pudo aplicar el cambio', err.response?.data?.error); }
  };

  const deleteUser = async (id) => {
    if (!confirm('¿Eliminar usuario permanentemente?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('Usuario eliminado');
    } catch (err) { toast.error('No se pudo eliminar', err.response?.data?.error); }
  };

  const changeRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      toast.success('Rol actualizado', role === 'ADMIN' ? 'Ahora es administrador.' : 'Volvió a empleado.');
    } catch (err) { toast.error('No se pudo cambiar el rol', err.response?.data?.error); }
  };

  const handleNewUserChange = (field) => (e) => setNewUser({ ...newUser, [field]: e.target.value });

  const submitNewUser = async () => {
    try {
      const created = await api.post('/admin/users', newUser);
      setUsers(prev => [...prev, created.data.user]);
      setShowUserModal(false);
      setNewUser({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' });
      toast.success('Usuario creado', `${created.data.user.fullName || created.data.user.username} fue agregado.`);
    } catch (err) {
      toast.error('Error al crear usuario', err.response?.data?.error || 'Verificá los datos.');
    }
  };

  const cards = [
    { icon: <Users size={18} />,        label: 'Usuarios totales',   value: stats?.totalUsers || 0,         trend: 'up',   delta: '+3 esta semana' },
    { icon: <Activity size={18} />,     label: 'En línea ahora',     value: stats?.onlineUsers || 0,        trend: 'flat', delta: 'tiempo real' },
    { icon: <MessageSquare size={18} />,label: 'Mensajes totales',   value: stats?.totalMessages || 0,      trend: 'up',   delta: 'histórico' },
    { icon: <TrendingUp size={18} />,   label: 'Mensajes hoy',       value: stats?.messagesToday || 0,      trend: 'up',   delta: 'últimas 24 h' },
    { icon: <Users size={18} />,        label: 'Grupos activos',     value: stats?.totalGroups || 0,        trend: 'flat', delta: 'configurados' },
    { icon: <HardDrive size={18} />,    label: 'Almacenamiento',     value: stats?.storage?.total || '0 B', trend: 'flat', delta: 'archivos subidos' },
  ];

  const tabs = [
    { id: 'stats', icon: <BarChart3 size={15} />,    label: 'Estadísticas' },
    { id: 'users', icon: <Users size={15} />,         label: 'Usuarios' },
    { id: 'logs',  icon: <ClipboardList size={15} />, label: 'Logs' },
    { id: 'audit', icon: <FileSearch size={15} />,    label: 'Auditoría' },
  ];

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.fullName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  });

  // Storage breakdown for bars
  const totalBytes = stats?.storage?.totalBytes || 0;

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-topbar">
          <button className="btn-icon" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
          <div className="admin-topbar-title">
            <span className="admin-topbar-title-main">Panel de administración</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-topbar">
        <button className="btn-icon" onClick={() => navigate('/')} aria-label="Volver"><ArrowLeft size={20} /></button>
        <Shield size={20} style={{ color: 'var(--accent)' }} />
        <div className="admin-topbar-title">
          <span className="admin-topbar-title-main">Panel de administración</span>
          <span className="admin-topbar-title-sub">Gestión de usuarios, métricas y auditoría · REFSA Chat</span>
        </div>
      </div>

      <div className="admin-tab-bar">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`admin-tab ${tab === t.id ? 'active' : ''}`}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'stats' && (
          <>
            <div className="stat-grid">
              {cards.map((c, i) => (
                <div key={i} className="stat-card-v2">
                  <div className="stat-card-v2-head">
                    <div className="stat-card-v2-icon">{c.icon}</div>
                    <span className={`stat-card-v2-trend ${c.trend}`}>{c.delta}</span>
                  </div>
                  <div>
                    <div className="stat-card-v2-value">{c.value}</div>
                    <div className="stat-card-v2-label">{c.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-section-v2">
              <div className="admin-section-head">
                <div className="admin-section-title"><HardDrive size={16} /> Almacenamiento por categoría</div>
                <span className="admin-section-title-count">{stats?.storage?.total || '0 B'}</span>
              </div>
              <div className="admin-section-body padded">
                {stats?.storage?.categories
                  ? Object.entries(stats.storage.categories).map(([k, v]) => {
                      // Try to render proportional bar — fall back to label-only if no totals
                      const bytes = typeof v === 'number' ? v : 0;
                      const pct = totalBytes ? Math.max(2, Math.min(100, (bytes / totalBytes) * 100)) : 30;
                      return (
                        <div key={k} className="admin-storage-bar">
                          <span className="admin-storage-bar-name">{k}</span>
                          <div className="admin-storage-bar-track">
                            <div className="admin-storage-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="admin-storage-bar-value">{typeof v === 'string' ? v : formatBytes(v)}</span>
                        </div>
                      );
                    })
                  : <div className="admin-empty"><div className="admin-empty-icon"><Inbox size={22} /></div><div className="admin-empty-title">Sin datos de almacenamiento</div></div>
                }
              </div>
            </div>

            <div className="admin-section-v2">
              <div className="admin-section-head">
                <div className="admin-section-title"><ClipboardList size={16} /> Actividad reciente</div>
                <button className="btn btn-ghost" style={{ fontSize: '0.75rem', height: '32px' }} onClick={() => setTab('logs')}>Ver todo <ArrowRight size={14} /></button>
              </div>
              <div className="admin-section-body">
                <table className="admin-table-v2">
                  <thead>
                    <tr><th>Acción</th><th>Usuario</th><th>Detalles</th><th style={{ textAlign: 'right' }}>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 8).map(l => (
                      <tr key={l.id}>
                        <td><span className="role-pill admin">{l.action}</span></td>
                        <td style={{ fontSize: '0.8125rem' }}>{l.user?.fullName || l.user?.email || '—'}</td>
                        <td style={{ maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{l.details || '—'}</td>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>{new Date(l.createdAt).toLocaleString('es')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'users' && (
          <div className="admin-section-v2">
            <div className="admin-section-head">
              <div className="admin-section-title">
                <Users size={16} /> Gestión de usuarios
                <span className="admin-section-title-count">{users.length}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <SearchIcon size={14} style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    className="input"
                    style={{ height: '34px', paddingLeft: '2rem', fontSize: '0.8125rem', width: '220px' }}
                    placeholder="Buscar usuario..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" style={{ height: '34px' }} onClick={() => setShowUserModal(true)}>
                  <Plus size={14} /> Nuevo usuario
                </button>
              </div>
            </div>
            <div className="admin-section-body" style={{ overflowX: 'auto' }}>
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-user">
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand-blue-bright))', color: 'white', fontWeight: 700 }}>
                            <span>{(u.fullName || u.username || 'U')[0].toUpperCase()}</span>
                            {u.isOnline && <span className="online-dot online" />}
                          </div>
                          <div className="cell-user-meta">
                            <span className="cell-user-name">{u.fullName || u.username}</span>
                            {u.username && u.fullName && <span className="cell-user-handle">@{u.username}</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{u.email || <em style={{ color: 'var(--text-tertiary)' }}>Sin email</em>}</td>
                      <td>
                        <select className="role-select" value={u.role} onChange={e => changeRole(u.id, e.target.value)}>
                          <option value="EMPLOYEE">Empleado</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </td>
                      <td>
                        <span className={`state-pill ${u.isBlocked ? 'blocked' : 'active'}`}>
                          {u.isBlocked ? 'Bloqueado' : 'Activo'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.125rem', justifyContent: 'flex-end' }}>
                          <button className="btn-icon" onClick={() => toggleBlock(u.id, u.isBlocked)} title={u.isBlocked ? 'Desbloquear' : 'Bloquear'}>
                            {u.isBlocked ? <UserCheck size={16} /> : <Ban size={16} />}
                          </button>
                          <button className="btn-icon" onClick={() => deleteUser(u.id)} title="Eliminar" style={{ color: 'var(--danger)' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="admin-empty">
                  <div className="admin-empty-icon"><Users size={22} /></div>
                  <div className="admin-empty-title">No se encontraron usuarios</div>
                  <div className="admin-empty-sub">Probá con otra búsqueda o creá un nuevo usuario.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="admin-section-v2">
            <div className="admin-section-head">
              <div className="admin-section-title">
                <ClipboardList size={16} /> Logs del sistema
                <span className="admin-section-title-count">{logs.length}</span>
              </div>
            </div>
            <div className="admin-section-body" style={{ overflowX: 'auto' }}>
              <table className="admin-table-v2">
                <thead>
                  <tr><th>Acción</th><th>Usuario</th><th>Detalles</th><th style={{ textAlign: 'right' }}>Fecha</th></tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id}>
                      <td><span className="role-pill admin">{l.action}</span></td>
                      <td style={{ fontSize: '0.875rem' }}>{l.user?.fullName || l.user?.email || '—'}</td>
                      <td style={{ maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{l.details || '—'}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-tertiary)', textAlign: 'right' }}>{new Date(l.createdAt).toLocaleString('es')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="admin-empty">
                  <div className="admin-empty-icon"><ClipboardList size={22} /></div>
                  <div className="admin-empty-title">Sin logs aún</div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'audit' && (
          <div className="admin-section-v2">
            <div className="admin-section-head">
              <div className="admin-section-title">
                <FileSearch size={16} /> Auditoría de mensajes
                <span className="admin-section-title-count">{auditTotal}</span>
              </div>
            </div>

            <div className="admin-filters">
              <div className="input-group">
                <label>Palabra clave</label>
                <input className="input" placeholder="Buscar texto..." value={searchVal} onChange={e => setSearchVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
              </div>
              <div className="input-group">
                <label>Remitente</label>
                <select className="input" value={senderVal} onChange={e => setSenderVal(e.target.value)}>
                  <option value="">Todos los empleados</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.username}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Desde</label>
                <input type="date" className="input" value={dateFromVal} onChange={e => setDateFromVal(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Hasta</label>
                <input type="date" className="input" value={dateToVal} onChange={e => setDateToVal(e.target.value)} />
              </div>
              <div className="input-actions">
                <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={14} /> Reset</button>
                <button className="btn btn-primary" onClick={handleSearch}><SearchIcon size={14} /> Buscar</button>
              </div>
            </div>

            <div className="admin-section-body" style={{ overflowX: 'auto' }}>
              {auditLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><div className="spinner" /></div>
              ) : messages.length === 0 ? (
                <div className="admin-empty">
                  <div className="admin-empty-icon"><FileSearch size={22} /></div>
                  <div className="admin-empty-title">Sin resultados</div>
                  <div className="admin-empty-sub">No se encontraron mensajes que coincidan con los filtros.</div>
                </div>
              ) : (
                <table className="admin-table-v2">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Emisor</th>
                      <th>Conversación</th>
                      <th>Tipo</th>
                      <th>Mensaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map(m => {
                      const isGroup = m.conversation?.isGroup;
                      const roomName = isGroup ? m.conversation?.name : 'Chat privado';
                      let displayContent = m.content;
                      if (m.type === 'IMAGE') displayContent = 'Imagen';
                      if (m.type === 'DOCUMENT') displayContent = 'Documento';
                      if (m.type === 'VIDEO') displayContent = 'Video';
                      if (m.type === 'AUDIO') displayContent = 'Audio';
                      return (
                        <tr key={m.id}>
                          <td style={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(m.createdAt).toLocaleString('es')}</td>
                          <td>
                            <div className="cell-user-meta">
                              <span className="cell-user-name" style={{ fontSize: '0.8125rem' }}>{m.sender?.fullName || m.sender?.username}</span>
                              <span className="cell-user-handle">{m.sender?.email}</span>
                            </div>
                          </td>
                          <td><span className={`role-pill ${isGroup ? 'admin' : 'employee'}`}>{roomName}</span></td>
                          <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{TYPE_ICONS[m.type] || <MessageSquare size={14} />} {m.type}</span></td>
                          <td style={{ maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }} title={m.content}>{displayContent}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {messages.length > 0 && (
              <div className="admin-pagination">
                <span className="admin-pagination-info">Mostrando <strong>{messages.length}</strong> de <strong>{auditTotal}</strong> · página <strong>{auditPage}</strong> de <strong>{auditTotalPages}</strong></span>
                <div className="admin-pagination-controls">
                  <button className="btn btn-secondary" disabled={auditPage === 1} onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}>Anterior</button>
                  <button className="btn btn-secondary" disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage(prev => prev + 1)}>Siguiente</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Crear Usuario */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Nuevo usuario</h3>
              <button className="btn-icon" onClick={() => setShowUserModal(false)} aria-label="Cerrar"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Nombre de usuario *</label>
                <input className="input" value={newUser.username} onChange={handleNewUserChange('username')} placeholder="juan.perez" />
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Contraseña *</label>
                <input type="password" className="input" value={newUser.password} onChange={handleNewUserChange('password')} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Nombre completo</label>
                <input className="input" value={newUser.fullName} onChange={handleNewUserChange('fullName')} placeholder="Juan Pérez" />
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Correo electrónico <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(opcional)</span></label>
                <input className="input" value={newUser.email} onChange={handleNewUserChange('email')} placeholder="juan@refsa.com.ar" />
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Rol</label>
                <select className="input" value={newUser.role} onChange={handleNewUserChange('role')}>
                  <option value="EMPLOYEE">Empleado</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowUserModal(false); setNewUser({ username: '', password: '', fullName: '', email: '', role: 'EMPLOYEE' }); }}>Cancelar</button>
              <button className="btn btn-primary" onClick={submitNewUser}><Plus size={14} /> Crear usuario</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
