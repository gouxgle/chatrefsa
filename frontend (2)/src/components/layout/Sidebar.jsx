import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import { Search, Plus, Users, Settings, LogOut, Moon, Sun, Shield, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import api, { API_URL } from '../../api/axios';

export default function Sidebar({ conversations, activeConversation, onSelect, onNewConversation, loading }) {
  const { user, logout } = useAuth();
  const { isUserOnline } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const name = c.isGroup ? c.name : c.participants?.find(p => p.user?.id !== user?.id)?.user?.fullName;
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const fetchUsers = async (q = '') => {
    try {
      const { data } = await api.get(`/users?search=${q}`);
      setUsers(data.users);
    } catch { /* ignore */ }
  };

  const openNewChat = () => { setShowNewChat(true); setShowMenu(false); fetchUsers(); };
  const openNewGroup = () => { setShowNewGroup(true); setShowMenu(false); fetchUsers(); };

  const startChat = async (userId) => {
    try {
      const { data } = await api.post('/chat/conversations', { userId });
      onNewConversation(data.conversation);
      setShowNewChat(false);
    } catch { /* ignore */ }
  };

  const createGroup = async () => {
    if (!groupName.trim()) return;
    try {
      const { data } = await api.post('/groups', { name: groupName, description: groupDesc, memberIds: selectedMembers });
      onNewConversation(data.group);
      setShowNewGroup(false);
      setGroupName(''); setGroupDesc(''); setSelectedMembers([]);
    } catch { /* ignore */ }
  };

  const getConversationInfo = (conv) => {
    if (conv.isGroup) return { name: conv.name, avatar: conv.avatar, online: false };
    const other = conv.participants?.find(p => p.user?.id !== user?.id)?.user;
    return { name: other?.fullName || other?.username || 'Usuario', avatar: other?.avatar, online: isUserOnline(other?.id), userId: other?.id };
  };

  const formatTime = (date) => {
    if (!date) return '';
    try { return formatDistanceToNow(new Date(date), { addSuffix: false, locale: es }); } catch { return ''; }
  };

  const renderAvatar = (info, size = 'avatar-lg') => (
    <div className={`avatar ${size}`}>
      {info.avatar ? <img src={`${API_URL}${info.avatar}`} alt="" /> : <span>{(info.name || '?')[0].toUpperCase()}</span>}
      {info.online !== undefined && <span className={`online-dot ${info.online ? 'online' : 'offline'}`} />}
    </div>
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <div className="avatar avatar-md" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
            {user?.avatar ? <img src={`${API_URL}${user.avatar}`} alt="" /> : <span>{(user?.fullName || 'U')[0]}</span>}
          </div>
          <div>
            <div className="sidebar-username">{user?.fullName || user?.username}</div>
            <div className="sidebar-status">En línea</div>
          </div>
        </div>
        <div className="sidebar-header-right">
          <button className="btn-icon" onClick={toggleTheme} title="Cambiar tema">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
          <button className="btn-icon" onClick={() => setShowMenu(!showMenu)} title="Menú"><Plus size={20} /></button>
          {showMenu && (
            <div style={{ position: 'absolute', top: '50px', right: '10px', background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-lg)', zIndex: 100, minWidth: '180px', overflow: 'hidden', animation: 'scaleIn 0.15s ease' }}>
              <button onClick={openNewChat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}><User size={16} /> Nuevo chat</button>
              <button onClick={openNewGroup} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}><Users size={16} /> Nuevo grupo</button>
              {user?.role === 'ADMIN' && <button onClick={() => { navigate('/admin'); setShowMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}><Shield size={16} /> Panel Admin</button>}
              <button onClick={() => navigate('/profile')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}><Settings size={16} /> Mi perfil</button>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '0.75rem 1rem', border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.875rem' }}><LogOut size={16} /> Cerrar sesión</button>
            </div>
          )}
        </div>
      </div>

      <div className="search-box">
        <Search size={16} className="search-icon" />
        <input placeholder="Buscar conversación..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="conversation-list">
        {loading ? (
          <div className="flex justify-center items-center" style={{ padding: '2rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No hay conversaciones</div>
        ) : filtered.map(conv => {
          const info = getConversationInfo(conv);
          const lastMsg = conv.lastMessage || conv.messages?.[0];
          return (
            <div key={conv.id} className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`} onClick={() => onSelect(conv)}>
              {renderAvatar(info)}
              <div className="conversation-info">
                <div className="conversation-name">
                  <span className="truncate">{conv.isGroup ? '👥 ' : ''}{info.name}</span>
                  <span className="time">{lastMsg ? formatTime(lastMsg.createdAt) : ''}</span>
                </div>
                <div className="conversation-preview">
                  <span className="preview-text">
                    {lastMsg ? (lastMsg.isDeleted ? '🚫 Mensaje eliminado' : lastMsg.content || '📎 Archivo') : 'Sin mensajes'}
                  </span>
                  {conv.unreadCount > 0 && <span className="badge badge-primary">{conv.unreadCount}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="modal-overlay" onClick={() => setShowNewChat(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Nuevo Chat</h3><button className="btn-icon" onClick={() => setShowNewChat(false)}>✕</button></div>
            <div className="modal-body">
              <input className="input" placeholder="Buscar usuario..." value={searchUsers} onChange={e => { setSearchUsers(e.target.value); fetchUsers(e.target.value); }} style={{ marginBottom: '1rem' }} />
              {users.map(u => (
                <div key={u.id} className="user-select-item" onClick={() => startChat(u.id)}>
                  <div className="avatar avatar-md">{u.avatar ? <img src={`${API_URL}${u.avatar}`} alt="" /> : <span>{(u.fullName || 'U')[0]}</span>}<span className={`online-dot ${isUserOnline(u.id) ? 'online' : 'offline'}`} /></div>
                  <div><div className="user-select-name">{u.fullName || u.username}</div><div className="user-select-email">{u.email}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="modal-overlay" onClick={() => setShowNewGroup(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Nuevo Grupo</h3><button className="btn-icon" onClick={() => setShowNewGroup(false)}>✕</button></div>
            <div className="modal-body">
              <div className="input-group"><label>Nombre del grupo</label><input className="input" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Ej: Equipo de Ventas" /></div>
              <div className="input-group" style={{ marginTop: '0.75rem' }}><label>Descripción</label><input className="input" value={groupDesc} onChange={e => setGroupDesc(e.target.value)} placeholder="Descripción opcional" /></div>
              <div style={{ marginTop: '1rem', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Agregar miembros:</div>
              <input className="input" placeholder="Buscar..." onChange={e => fetchUsers(e.target.value)} style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }} />
              {users.map(u => (
                <label key={u.id} className="user-select-item" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedMembers.includes(u.id)} onChange={e => setSelectedMembers(e.target.checked ? [...selectedMembers, u.id] : selectedMembers.filter(id => id !== u.id))} />
                  <div className="avatar avatar-sm">{u.avatar ? <img src={`${API_URL}${u.avatar}`} alt="" /> : <span>{(u.fullName || 'U')[0]}</span>}</div>
                  <div className="user-select-name">{u.fullName || u.username}</div>
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNewGroup(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createGroup} disabled={!groupName.trim()}>Crear Grupo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
