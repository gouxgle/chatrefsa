import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();
// Conexión al mismo origen — nginx proxea /socket.io → backend:5000
const WS_URL = window.location.origin;

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const listenersRef = useRef({});

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const s = io(WS_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true, reconnectionDelay: 1000 });

    s.on('connect', () => console.log('🔌 Socket connected'));
    s.on('user_online', ({ userId }) => setOnlineUsers(prev => ({ ...prev, [userId]: true })));
    s.on('user_offline', ({ userId }) => setOnlineUsers(prev => ({ ...prev, [userId]: false })));
    s.on('user_typing', ({ userId, conversationId }) => {
      setTypingUsers(prev => ({ ...prev, [`${conversationId}_${userId}`]: true }));
    });
    s.on('user_stop_typing', ({ userId, conversationId }) => {
      setTypingUsers(prev => { const n = { ...prev }; delete n[`${conversationId}_${userId}`]; return n; });
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [user]);

  const emit = useCallback((event, data) => { socket?.emit(event, data); }, [socket]);

  const on = useCallback((event, callback) => {
    if (!socket) return;
    socket.on(event, callback);
    return () => socket.off(event, callback);
  }, [socket]);

  const sendMessage = useCallback((conversationId, content, type = 'TEXT', replyToId = null) => {
    emit('send_message', { conversationId, content, type, replyToId });
  }, [emit]);

  const sendTyping = useCallback((conversationId) => emit('typing', { conversationId }), [emit]);
  const sendStopTyping = useCallback((conversationId) => emit('stop_typing', { conversationId }), [emit]);
  const markRead = useCallback((conversationId) => emit('mark_read', { conversationId }), [emit]);
  const joinConversation = useCallback((conversationId) => emit('join_conversation', conversationId), [emit]);

  const isUserOnline = useCallback((userId) => onlineUsers[userId] || false, [onlineUsers]);
  const getTypingInConversation = useCallback((conversationId) => {
    return Object.keys(typingUsers).filter(k => k.startsWith(`${conversationId}_`)).map(k => k.split('_').pop());
  }, [typingUsers]);

  return (
    <SocketContext.Provider value={{ socket, emit, on, sendMessage, sendTyping, sendStopTyping, markRead, joinConversation, isUserOnline, getTypingInConversation, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
