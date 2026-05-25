import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/layout/ChatWindow';
import './Chat.css';

export default function Chat() {
  const { user, resendVerification } = useAuth();
  const { on, joinConversation } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState({ type: '', message: '' });

  // Refs de estado para evitar cierres obsoletos en listeners de sockets
  const conversationsRef = useRef(conversations);
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

  // Actualizador dinámico del título del navegador (Tab flashing / unread indicator)
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) Chat REFSA`;
    } else {
      document.title = 'Chat REFSA';
    }
  }, [conversations]);

  // Solicitar permiso de notificaciones de escritorio en el cargado inicial
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Función generadora de audio de notificación sutil estilo "WhatsApp ping" con Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.08); // A5
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (err) {
      console.warn('AudioContext bloqueado/no soportado:', err);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    setResendStatus({ type: '', message: '' });
    try {
      await resendVerification(user.email);
      setResendStatus({ type: 'success', message: '¡Correo reenviado!' });
      setTimeout(() => setResendStatus({ type: '', message: '' }), 5000);
    } catch (err) {
      setResendStatus({ type: 'error', message: err.response?.data?.error || 'Error al reenviar.' });
    } finally {
      setResending(false);
    }
  };

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
    } catch (err) { console.error('Error fetching conversations:', err); }
    finally { setLoadingConvos(false); }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!on) return;
    const unsub1 = on('new_message', (message) => {
      // Reproducir sonido e iniciar notificación si es un mensaje recibido de otra persona
      if (message.senderId !== user?.id) {
        playNotificationChime();

        const isCurrentChat = activeConversationRef.current?.id === message.conversationId;
        const isTabHidden = document.hidden;

        if ((isTabHidden || !isCurrentChat) && 'Notification' in window && Notification.permission === 'granted') {
          const senderName = message.sender?.fullName || message.sender?.username || 'Mensaje Nuevo';
          const textPreview = message.content || '📎 Archivo enviado';
          
          const notification = new Notification(senderName, {
            body: textPreview,
            icon: '/favicon.ico',
            tag: message.conversationId,
            requireInteraction: false
          });
          
          notification.onclick = () => {
            window.focus();
            const targetConv = conversationsRef.current.find(c => c.id === message.conversationId);
            if (targetConv) {
              handleSelectConversation(targetConv);
            }
          };
        }
      }

      setConversations(prev => {
        const updated = prev.map(c => {
          if (c.id === message.conversationId) {
            return { ...c, lastMessage: message, messages: [message], updatedAt: new Date().toISOString(),
              unreadCount: activeConversationRef.current?.id === c.id ? c.unreadCount : (c.unreadCount || 0) + 1 };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    });
    const unsub2 = on('group_created', () => fetchConversations());
    const unsub3 = on('messages_read', ({ conversationId, userId }) => {
      if (userId === user?.id) {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      }
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); };
  }, [on, user, fetchConversations]);

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv);
    joinConversation(conv.id);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    if (window.innerWidth <= 768) setShowSidebar(false);
  };

  const handleBack = () => { setShowSidebar(true); setActiveConversation(null); };

  const handleNewConversation = (conv) => {
    setConversations(prev => {
      const exists = prev.find(c => c.id === conv.id);
      if (exists) return prev;
      return [conv, ...prev];
    });
    handleSelectConversation(conv);
  };

  return (
    <div className="chat-page">
      {user && !user.isVerified && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
          color: '#f59e0b',
          padding: '0.625rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.8125rem',
          backdropFilter: 'blur(10px)',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚠️</span>
            <span>
              Tu cuenta de correo no está verificada. Por favor, verifica tu cuenta para habilitar todas las funcionalidades de seguridad.
              {resendStatus.message && (
                <strong style={{
                  marginLeft: '1rem',
                  color: resendStatus.type === 'success' ? '#25d366' : '#ef4444'
                }}>
                  {resendStatus.message}
                </strong>
              )}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                height: 'auto',
                color: '#f59e0b',
                background: 'transparent',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {resending ? 'Enviando...' : 'Reenviar Email'}
            </button>
            <a
              href="/verify-email"
              style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.75rem',
                height: 'auto',
                background: '#f59e0b',
                color: '#111b21',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600',
                display: 'inline-block'
              }}
            >
              Verificar Ahora
            </a>
          </div>
        </div>
      )}
      <div className="chat-layout">
        <div className={`chat-sidebar-wrapper ${!showSidebar ? 'hidden-mobile' : ''}`}>
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelect={handleSelectConversation}
            onNewConversation={handleNewConversation}
            loading={loadingConvos}
          />
        </div>
        <div className={`chat-main-wrapper ${showSidebar && !activeConversation ? 'hidden-mobile' : ''}`}>
          {activeConversation ? (
            <ChatWindow conversation={activeConversation} onBack={handleBack} onUpdate={fetchConversations} />
          ) : (
            <div className="chat-empty">
              <div className="chat-empty-content">
                <div className="chat-empty-icon">💬</div>
                <h2>Chat REFSA</h2>
                <p>Selecciona una conversación o inicia una nueva</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
