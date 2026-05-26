import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useToast } from '../../context/ToastContext';
import { ArrowLeft, Search, MoreVertical, Send, Paperclip, Smile, Sticker, X, Reply, Pencil, Trash2, Forward, Check, CheckCheck, FileText, Download, Image as ImageIcon, Video, Music, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import api from '../../api/axios';
import GroupInfoPanel from './GroupInfoPanel';
import StickerPicker from './StickerPicker';

const EMOJIS_BY_CAT = {
  '😀': ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤔','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱'],
  '❤️': ['❤️','🧡','💛','💚','💙','💜','🖤','💔','💕','💞','💓','💗','💖','💘','💝','🌹','✨','🔥','💯','⭐','🌟','💫'],
  '👍': ['👍','👎','👊','✊','🤛','🤜','🤞','✌️','🤟','🤘','👌','🤙','👈','👉','👆','👇','☝️','✋','🤚','🖐','🖖','👋','🤝','🙏','💪','🖕'],
  '🎉': ['🎉','🎊','🎈','🎁','🎀','🏆','🥇','🥈','🥉','⚽','🏀','🎯','🎮','🎸','🎵','🎶','🎤','🎬','📸','💻','📱','💡','🔑','📌','📎','✏️','📝','📚','📊','💼'],
};

export default function ChatWindow({ conversation, onBack, onUpdate }) {
  const { user } = useAuth();
  const toast = useToast();
  const { on, sendMessage: socketSend, sendTyping, sendStopTyping, markRead, isUserOnline, getTypingInConversation } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editMsg, setEditMsg] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiCat, setEmojiCat] = useState('😀');
  const [showStickers, setShowStickers] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeout = useRef(null);

  const otherUser = !conversation.isGroup ? conversation.participants?.find(p => p.user?.id !== user?.id)?.user : null;
  const chatName = conversation.isGroup ? conversation.name : (otherUser?.fullName || otherUser?.username);
  const chatOnline = otherUser ? isUserOnline(otherUser.id) : false;
  const typingUsers = getTypingInConversation(conversation.id);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = useCallback(async (p = 1) => {
    try {
      const { data } = await api.get(`/chat/conversations/${conversation.id}/messages?page=${p}&limit=50`);
      if (p === 1) setMessages(data.messages);
      else setMessages(prev => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(p);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [conversation.id]);

  useEffect(() => { setLoading(true); setMessages([]); setPage(1); fetchMessages(1); markRead(conversation.id); }, [conversation.id, fetchMessages, markRead]);

  useEffect(() => { if (!loading && page === 1) scrollToBottom(); }, [messages, loading, page]);

  useEffect(() => {
    if (!on) return;
    const unsub1 = on('new_message', (msg) => {
      if (msg.conversationId === conversation.id) {
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollToBottom();
        markRead(conversation.id);
      }
    });
    const unsub2 = on('message_edited', (msg) => {
      if (msg.conversationId === conversation.id) setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, content: msg.content, isEdited: true } : m));
    });
    const unsub3 = on('message_deleted', ({ messageId, conversationId }) => {
      if (conversationId === conversation.id) setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isDeleted: true, content: null } : m));
    });
    const unsub4 = on('messages_read', ({ conversationId: cid, userId: uid }) => {
      if (cid === conversation.id) setMessages(prev => prev.map(m => ({ ...m, reads: [...(m.reads || []), { userId: uid }] })));
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
  }, [on, conversation.id, markRead]);

  const handleSendSticker = (sticker) => {
    socketSend(conversation.id, `/uploads/stickers/${sticker.filename}`, 'STICKER');
    setShowStickers(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && !editMsg) return;

    if (editMsg) {
      try {
        await api.put(`/chat/messages/${editMsg.id}`, { content: text });
        setEditMsg(null);
      } catch { /* ignore */ }
    } else {
      socketSend(conversation.id, text, 'TEXT', replyTo?.id);
      setReplyTo(null);
    }
    setInput('');
    setShowEmoji(false);
    sendStopTyping(conversation.id);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTyping = () => {
    sendTyping(conversation.id);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendStopTyping(conversation.id), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversation.id);
    try {
      await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Archivo enviado', file.name);
    } catch (err) {
      toast.error('No se pudo enviar el archivo', err.response?.data?.error || 'Verificá tu conexión.');
    }
    e.target.value = '';
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    handleTyping();
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const startEdit = (msg) => { setEditMsg(msg); setInput(msg.content || ''); setReplyTo(null); textareaRef.current?.focus(); };
  const startReply = (msg) => { setReplyTo(msg); setEditMsg(null); textareaRef.current?.focus(); };

  const deleteMessage = async (id) => { try { await api.delete(`/chat/messages/${id}`); } catch { /* ignore */ } };
  const forwardMessage = async (id) => {
    const target = prompt('ID de la conversación destino:');
    if (target) { try { await api.post(`/chat/messages/${id}/forward`, { conversationId: target }); } catch { /* ignore */ } }
  };

  const getFileIcon = (type) => {
    if (type === 'IMAGE') return <ImageIcon size={18} />;
    if (type === 'VIDEO') return <Video size={18} />;
    if (type === 'AUDIO') return <Music size={18} />;
    return <FileText size={18} />;
  };

  const renderMessage = (msg) => {
    if (msg.type === 'SYSTEM') return <div key={msg.id} className="message-wrapper system"><div className="message-bubble system">{msg.content}</div></div>;

    const isOwn = msg.senderId === user?.id || msg.sender?.id === user?.id;
    const isRead = msg.reads?.some(r => r.userId !== user?.id);

    if (msg.type === 'STICKER') {
      return (
        <div key={msg.id} className={`message-wrapper ${isOwn ? 'outgoing' : 'incoming'}`}>
          <div className="sticker-message">
            {!isOwn && conversation.isGroup && <div className="message-sender">{msg.sender?.fullName || msg.sender?.username}</div>}
            <img src={msg.content} alt="sticker" className="sticker-message-img" />
            <div className="message-meta" style={{ justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
              <span className="message-time">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}</span>
              {isOwn && <span className={`message-status ${isRead ? 'read' : ''}`}>{isRead ? <CheckCheck size={14} /> : <Check size={14} />}</span>}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`message-wrapper ${isOwn ? 'outgoing' : 'incoming'}`}>
        <div className={`message-bubble ${isOwn ? 'outgoing' : 'incoming'}`}>
          {!isOwn && conversation.isGroup && <div className="message-sender">{msg.sender?.fullName || msg.sender?.username}</div>}
          {msg.replyTo && (
            <div className="message-reply-preview">
              <div className="reply-name">{msg.replyTo.sender?.fullName || msg.replyTo.sender?.username}</div>
              <div className="reply-text">{msg.replyTo.content || '📎 Archivo'}</div>
            </div>
          )}
          {msg.isDeleted ? (
            <div className="message-deleted">🚫 Mensaje eliminado</div>
          ) : (
            <>
              {msg.files?.map(f => (
                <div key={f.id} className="file-attachment">
                  {f.mimetype?.startsWith('image/') ? (
                    <div 
                      className="image-attachment-wrapper" 
                      onClick={() => setLightbox({ url: `${API_URL}/uploads/${f.path?.split('/uploads/')?.[1] || f.filename}`, name: f.originalName, id: f.id })}
                    >
                      <img src={`${API_URL}/uploads/${f.path?.split('/uploads/')?.[1] || f.filename}`} alt={f.originalName} loading="lazy" />
                      <div className="image-attachment-overlay">
                        <div className="image-action-btn" title="Ampliar Imagen">
                          <Search size={18} />
                        </div>
                        <a 
                          href={`${API_URL}/api/files/${f.id}/download?token=${localStorage.getItem('accessToken')}`} 
                          download 
                          className="image-action-btn" 
                          title="Descargar Imagen" 
                          onClick={(e) => e.stopPropagation()}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    </div>
                  ) : f.mimetype?.startsWith('video/') ? (
                    <video controls src={`${API_URL}/uploads/${f.path?.split('/uploads/')?.[1] || f.filename}`} />
                  ) : (
                    <div className="file-attachment-info">
                      <div className="file-attachment-icon">{getFileIcon(msg.type)}</div>
                      <div className="file-attachment-details">
                        <div className="file-attachment-name">{f.originalName}</div>
                        <div className="file-attachment-size">{(f.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <a href={`${API_URL}/api/files/${f.id}/download?token=${localStorage.getItem('accessToken')}`} download className="btn-icon" target="_blank" rel="noopener noreferrer"><Download size={16} /></a>
                    </div>
                  )}
                </div>
              ))}
              {msg.content && <div className="message-content">{msg.content}</div>}
            </>
          )}
          <div className="message-meta">
            {msg.isEdited && <span className="message-edited">editado</span>}
            <span className="message-time">{msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}</span>
            {isOwn && <span className={`message-status ${isRead ? 'read' : ''}`}>{isRead ? <CheckCheck size={14} /> : <Check size={14} />}</span>}
          </div>
          {!msg.isDeleted && (
            <div className="message-actions">
              <button onClick={() => startReply(msg)} title="Responder"><Reply size={14} /></button>
              {isOwn && <button onClick={() => startEdit(msg)} title="Editar"><Pencil size={14} /></button>}
              {isOwn && <button onClick={() => deleteMessage(msg.id)} title="Eliminar"><Trash2 size={14} /></button>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex" style={{ height: '100%' }}>
      <div className="flex-col flex-1" style={{ display: 'flex', minWidth: 0 }}>
        {/* Header */}
        <div className="chat-header">
          <button className="btn-icon mobile-only" onClick={onBack}><ArrowLeft size={20} /></button>
          <div className="avatar avatar-md" onClick={() => setShowInfo(!showInfo)} style={{ cursor: 'pointer' }}>
            {otherUser?.avatar ? <img src={`${API_URL}${otherUser.avatar}`} alt="" /> : <span>{(chatName || '?')[0].toUpperCase()}</span>}
            {otherUser && <span className={`online-dot ${chatOnline ? 'online' : 'offline'}`} />}
          </div>
          <div className="chat-header-info" onClick={() => setShowInfo(!showInfo)} style={{ cursor: 'pointer' }}>
            <div className="chat-header-name">{conversation.isGroup ? '👥 ' : ''}{chatName}</div>
            <div className="chat-header-status">
              {typingUsers.length > 0 ? 'escribiendo...' : conversation.isGroup ? `${conversation.participants?.length || 0} miembros` : chatOnline ? 'En línea' : 'Desconectado'}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {hasMore && <button className="load-more-btn" onClick={() => fetchMessages(page + 1)}>Cargar mensajes anteriores</button>}
          {loading ? (
            <div className="flex justify-center items-center flex-1"><div className="spinner" /></div>
          ) : messages.length === 0 ? (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <div className="empty-state-icon"><MessageCircle size={24} /></div>
              <div className="empty-state-title">Sin mensajes todavía</div>
              <div className="empty-state-sub">
                {conversation.isGroup
                  ? 'Sé el primero en romper el hielo en este grupo.'
                  : 'Empezá la conversación con un saludo.'}
              </div>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          {typingUsers.length > 0 && (
            <div className="typing-indicator"><div className="typing-dots"><span /><span /><span /></div><span>escribiendo...</span></div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Bar */}
        {replyTo && (
          <div className="reply-bar">
            <div className="reply-bar-content">
              <div className="reply-bar-name">{replyTo.sender?.fullName || replyTo.sender?.username}</div>
              <div className="reply-bar-text">{replyTo.content || '📎 Archivo'}</div>
            </div>
            <button className="btn-icon" onClick={() => setReplyTo(null)}><X size={18} /></button>
          </div>
        )}
        {editMsg && (
          <div className="reply-bar" style={{ borderLeftColor: 'var(--warning)' }}>
            <div className="reply-bar-content"><div className="reply-bar-name" style={{ color: 'var(--warning)' }}>Editando mensaje</div><div className="reply-bar-text">{editMsg.content}</div></div>
            <button className="btn-icon" onClick={() => { setEditMsg(null); setInput(''); }}><X size={18} /></button>
          </div>
        )}

        {/* Input */}
        <div className="message-input-area">
          <div className="message-input-actions">
            <button className="btn-icon" onClick={() => { setShowEmoji(!showEmoji); setShowStickers(false); }}><Smile size={22} /></button>
            <button className="btn-icon" onClick={() => { setShowStickers(!showStickers); setShowEmoji(false); }} title="Stickers"><Sticker size={22} /></button>
            <button className="btn-icon" onClick={() => fileInputRef.current?.click()}><Paperclip size={22} /></button>
            <input ref={fileInputRef} type="file" hidden onChange={handleFileUpload} />
          </div>
          <div className="message-input-wrapper" style={{ position: 'relative' }}>
            <textarea ref={textareaRef} rows={1} placeholder="Escribe un mensaje..." value={input} onChange={handleTextareaInput} onKeyDown={handleKeyDown} />
            {showStickers && (
              <StickerPicker onSend={handleSendSticker} onClose={() => setShowStickers(false)} />
            )}
            {showEmoji && (
              <div className="emoji-picker-wrapper">
                <div className="emoji-picker">
                  <div className="emoji-picker-header">
                    {Object.keys(EMOJIS_BY_CAT).map(cat => (
                      <button key={cat} className={emojiCat === cat ? 'active' : ''} onClick={() => setEmojiCat(cat)}>{cat}</button>
                    ))}
                  </div>
                  <div className="emoji-grid">
                    {EMOJIS_BY_CAT[emojiCat].map(e => <button key={e} onClick={() => { setInput(prev => prev + e); textareaRef.current?.focus(); }}>{e}</button>)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <button className="send-btn" onClick={handleSend} disabled={!input.trim() && !editMsg}><Send size={20} /></button>
        </div>
      </div>

      {/* Group Info Panel */}
      {showInfo && conversation.isGroup && (
        <GroupInfoPanel
          conversation={conversation}
          messages={messages}
          onClose={() => setShowInfo(false)}
          onLeft={() => { setShowInfo(false); onBack?.(); onUpdate?.(); }}
          onDeleted={() => { setShowInfo(false); onBack?.(); onUpdate?.(); }}
        />
      )}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)} title="Cerrar"><X size={24} /></button>
            <div className="lightbox-content">
              <img src={lightbox.url} alt={lightbox.name} />
            </div>
            <div className="lightbox-footer">
              <span className="lightbox-filename">{lightbox.name}</span>
              <a 
                href={`${API_URL}/api/files/${lightbox.id}/download?token=${localStorage.getItem('accessToken')}`} 
                download 
                className="lightbox-download-btn"
                title="Descargar"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={18} />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
