import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import Sidebar from '../components/layout/Sidebar';
import ChatWindow from '../components/layout/ChatWindow';
import WhatsNewTip from '../components/WhatsNewTip';
import { Lock, AlertTriangle, X } from 'lucide-react';
import refsaLogo from '../assets/refsa-mark-transparent.png';
import './Chat.css';

export default function Chat() {
  const { user, resendVerification } = useAuth();
  const { on, joinConversation } = useSocket();
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [resending, setResending] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const conversationsRef = useRef(conversations);
  const activeConversationRef = useRef(activeConversation);

  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeConversationRef.current = activeConversation; }, [activeConversation]);

  // Título del navegador con contador de no leídos
  useEffect(() => {
    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
    document.title = totalUnread > 0 ? `(${totalUnread}) Chat REFSA` : 'Chat REFSA';
  }, [conversations]);

  // Permiso de notificaciones de escritorio
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.22);
    } catch (err) { /* ignore */ }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    setResending(true);
    try {
      await resendVerification(user.email);
      toast.success('Correo reenviado', 'Revisá tu bandeja de entrada para verificar tu cuenta.');
    } catch (err) {
      toast.error('No se pudo reenviar', err.response?.data?.error || 'Intentá de nuevo más tarde.');
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
      if (message.senderId !== user?.id) {
        playNotificationChime();
        const isCurrentChat = activeConversationRef.current?.id === message.conversationId;
        const isTabHidden = document.hidden;

        if ((isTabHidden || !isCurrentChat) && 'Notification' in window && Notification.permission === 'granted') {
          const senderName = message.sender?.fullName || message.sender?.username || 'Mensaje Nuevo';
          const textPreview = message.content || '📎 Archivo enviado';
          const notification = new Notification(senderName, {
            body: textPreview,
            icon: '/favicon.png',
            tag: message.conversationId,
            requireInteraction: false,
          });
          notification.onclick = () => {
            window.focus();
            const targetConv = conversationsRef.current.find(c => c.id === message.conversationId);
            if (targetConv) handleSelectConversation(targetConv);
          };
        } else if (!isCurrentChat) {
          // Toast in-app cuando la pestaña está visible pero no es la conversación activa
          const senderName = message.sender?.fullName || message.sender?.username || 'Mensaje nuevo';
          const textPreview = message.content || '📎 Archivo';
          toast.info(senderName, textPreview);
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
    const unsub4 = on('group_deleted', ({ groupId }) => {
      setConversations(prev => prev.filter(c => c.id !== groupId));
      if (activeConversationRef.current?.id === groupId) {
        setActiveConversation(null);
        setShowSidebar(true);
      }
    });
    const unsub3 = on('messages_read', ({ conversationId, userId }) => {
      if (userId === user?.id) {
        setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c));
      }
    });
    return () => { unsub1?.(); unsub2?.(); unsub3?.(); unsub4?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {user && !user.isVerified && !bannerDismissed && (
        <div className="verify-banner" role="alert">
          <div className="verify-banner-left">
            <span className="verify-banner-icon"><AlertTriangle size={14} /></span>
            <span>
              <strong style={{ color: 'var(--brand-orange-deep)' }}>Cuenta sin verificar.</strong>{' '}
              Verificá tu correo para habilitar todas las funciones de seguridad.
            </span>
          </div>
          <div className="verify-banner-actions">
            <button className="btn btn-secondary" onClick={handleResendVerification} disabled={resending}>
              {resending ? 'Enviando…' : 'Reenviar correo'}
            </button>
            <a href="/verify-email" className="btn btn-warning">Verificar ahora</a>
            <button className="btn-icon" style={{ width: 30, height: 30 }} onClick={() => setBannerDismissed(true)} aria-label="Cerrar"><X size={14} /></button>
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
                <div className="chat-empty-logo"><img src={refsaLogo} alt="REFSA" /></div>
                <h2>Chat REFSA</h2>
                <p>Seleccioná una conversación del panel izquierdo o iniciá una nueva para comenzar a chatear con tu equipo.</p>
                <div className="chat-empty-footer">
                  <Lock size={12} />
                  <span>Comunicación interna segura</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <WhatsNewTip />
    </div>
  );
}
