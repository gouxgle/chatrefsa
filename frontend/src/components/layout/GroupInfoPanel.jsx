import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import {
  X, Users, Image as ImageIcon, Settings, FileText, Video as VideoIcon,
  Music as MusicIcon, BellOff, Bell, LogOut, Trash2, ShieldOff, Inbox
} from 'lucide-react';
import { API_URL } from '../../api/axios';

/**
 * Panel lateral derecho con info del grupo, en tabs:
 *  · Miembros — lista con rol y avatar
 *  · Multimedia — grilla compacta de archivos compartidos
 *  · Configuración — toggles (notificaciones, agregar miembros, etc.) + acciones destructivas
 *
 * Props:
 *  - conversation: la conversación activa (debe ser isGroup === true)
 *  - messages: array de mensajes de la conversación (para extraer multimedia)
 *  - onClose: cerrar el panel
 */
export default function GroupInfoPanel({ conversation, messages = [], onClose }) {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const toast = useToast();
  const [tab, setTab] = useState('members');
  const [muted, setMuted] = useState(false);
  const [openInvite, setOpenInvite] = useState(true);

  const members = conversation.participants || [];

  // Extraer archivos compartidos por orden cronológico inverso
  const mediaFiles = messages
    .flatMap(m => (m.files || []).map(f => ({ ...f, msgType: m.type, createdAt: m.createdAt })))
    .reverse();

  const initial = (conversation.name || '?')[0].toUpperCase();

  const handleNotImplemented = (label) => {
    toast.info('Próximamente', `${label} estará disponible en una próxima versión.`);
  };

  return (
    <div className="group-info-panel">
      <div className="group-info-header">
        <button className="btn-icon" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        <span style={{ fontWeight: 600 }}>Información del grupo</span>
      </div>

      <div className="group-info-body" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1rem 0.5rem' }}>
          <div className="group-info-avatar">
            <div className="avatar avatar-xl" style={{ background: 'linear-gradient(135deg, var(--accent), var(--brand-blue-bright))', color: 'white', fontWeight: 700 }}>
              <span>{initial}</span>
            </div>
            <div className="group-info-name">{conversation.name}</div>
            {conversation.description && <div className="group-info-desc">{conversation.description}</div>}
          </div>
        </div>

        <div className="group-info-tabs">
          <button
            className={`group-info-tab ${tab === 'members' ? 'active' : ''}`}
            onClick={() => setTab('members')}
          >
            <Users size={14} /> Miembros
            <span className="group-info-tab-count">{members.length}</span>
          </button>
          <button
            className={`group-info-tab ${tab === 'media' ? 'active' : ''}`}
            onClick={() => setTab('media')}
          >
            <ImageIcon size={14} /> Multimedia
            {mediaFiles.length > 0 && <span className="group-info-tab-count">{mediaFiles.length}</span>}
          </button>
          <button
            className={`group-info-tab ${tab === 'config' ? 'active' : ''}`}
            onClick={() => setTab('config')}
          >
            <Settings size={14} /> Config
          </button>
        </div>

        <div style={{ padding: '0.75rem 1rem 1.5rem' }}>
          {tab === 'members' && (
            members.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 'auto', padding: '2rem 0' }}>
                <div className="empty-state-icon"><Users size={24} /></div>
                <div className="empty-state-title">Aún no hay miembros</div>
                <div className="empty-state-sub">Agregá personas para empezar a colaborar.</div>
              </div>
            ) : (
              members.map(p => (
                <div key={p.id} className="group-member-item">
                  <div className="avatar avatar-md">
                    {p.user?.avatar
                      ? <img src={`${API_URL}${p.user.avatar}`} alt="" />
                      : <span>{(p.user?.fullName || p.user?.username || '?')[0].toUpperCase()}</span>}
                    <span className={`online-dot ${isUserOnline(p.user?.id) ? 'online' : 'offline'}`} />
                  </div>
                  <div className="group-member-info">
                    <div className="group-member-name">
                      {p.user?.fullName || p.user?.username}
                      {p.user?.id === user?.id && <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}> (Vos)</span>}
                    </div>
                    {p.user?.email && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{p.user.email}</div>
                    )}
                  </div>
                  {p.role && p.role !== 'MEMBER' && <span className="group-member-role">{p.role}</span>}
                </div>
              ))
            )
          )}

          {tab === 'media' && (
            mediaFiles.length === 0 ? (
              <div className="empty-state" style={{ minHeight: 'auto', padding: '2rem 0' }}>
                <div className="empty-state-icon"><Inbox size={24} /></div>
                <div className="empty-state-title">Sin archivos compartidos</div>
                <div className="empty-state-sub">Las imágenes, documentos y videos que se envíen aquí aparecerán en esta sección.</div>
              </div>
            ) : (
              <div className="media-grid">
                {mediaFiles.slice(0, 30).map(f => {
                  const isImage = f.mimetype?.startsWith('image/');
                  const isVideo = f.mimetype?.startsWith('video/');
                  const isAudio = f.mimetype?.startsWith('audio/');
                  const url = `${API_URL}/uploads/${f.path?.split('/uploads/')?.[1] || f.filename}`;
                  return (
                    <a
                      key={f.id}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-thumb"
                      title={f.originalName}
                    >
                      {isImage ? (
                        <img src={url} alt={f.originalName} loading="lazy" />
                      ) : (
                        <div className="media-thumb-icon">
                          {isVideo  ? <VideoIcon size={22} /> :
                           isAudio  ? <MusicIcon size={22} /> :
                                      <FileText size={22} />}
                        </div>
                      )}
                      {isVideo && <span className="media-thumb-badge">VIDEO</span>}
                      {isAudio && <span className="media-thumb-badge">AUDIO</span>}
                    </a>
                  );
                })}
              </div>
            )
          )}

          {tab === 'config' && (
            <div>
              <div className="config-row">
                <div className="config-row-info">
                  <div className="config-row-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {muted ? <BellOff size={15} /> : <Bell size={15} />}
                    {muted ? 'Notificaciones silenciadas' : 'Notificaciones activas'}
                  </div>
                  <div className="config-row-sub">Recibí avisos cuando se envíe un mensaje en este grupo.</div>
                </div>
                <button
                  className={`toggle-switch ${!muted ? 'on' : ''}`}
                  onClick={() => { setMuted(!muted); toast.success(muted ? 'Notificaciones activadas' : 'Notificaciones silenciadas'); }}
                  aria-label="Silenciar notificaciones"
                />
              </div>

              <div className="config-row">
                <div className="config-row-info">
                  <div className="config-row-title">Permitir agregar miembros</div>
                  <div className="config-row-sub">Cualquier miembro puede invitar a más personas.</div>
                </div>
                <button
                  className={`toggle-switch ${openInvite ? 'on' : ''}`}
                  onClick={() => setOpenInvite(!openInvite)}
                  aria-label="Permitir agregar miembros"
                />
              </div>

              <div className="config-row">
                <div className="config-row-info">
                  <div className="config-row-title">Agregar participantes</div>
                  <div className="config-row-sub">Invitá a más compañeros a este grupo.</div>
                </div>
                <button className="btn btn-secondary" style={{ height: 32, fontSize: '0.75rem' }} onClick={() => handleNotImplemented('Agregar participantes')}>
                  <Users size={14} /> Invitar
                </button>
              </div>

              <div className="config-row">
                <div className="config-row-info config-row-danger">
                  <div className="config-row-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogOut size={15} /> Salir del grupo
                  </div>
                  <div className="config-row-sub">Vas a dejar de recibir mensajes de este grupo.</div>
                </div>
                <button className="btn btn-secondary" style={{ height: 32, fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger-light)' }} onClick={() => handleNotImplemented('Salir del grupo')}>
                  Salir
                </button>
              </div>

              {user?.role === 'ADMIN' && (
                <div className="config-row">
                  <div className="config-row-info config-row-danger">
                    <div className="config-row-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Trash2 size={15} /> Eliminar grupo
                    </div>
                    <div className="config-row-sub">Esta acción no se puede deshacer.</div>
                  </div>
                  <button className="btn btn-danger" style={{ height: 32, fontSize: '0.75rem' }} onClick={() => handleNotImplemented('Eliminar grupo')}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
