import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220);
  }, []);

  const push = useCallback((opts) => {
    const id = nextId++;
    const toast = {
      id,
      type: opts.type || 'info',
      title: opts.title,
      message: opts.message,
      duration: opts.duration ?? 4000,
    };
    setToasts(prev => [...prev, toast]);
    if (toast.duration) {
      setTimeout(() => dismiss(id), toast.duration);
    }
    return id;
  }, [dismiss]);

  const api = {
    push,
    dismiss,
    success: (titleOrOpts, message) => typeof titleOrOpts === 'string'
      ? push({ type: 'success', title: titleOrOpts, message })
      : push({ type: 'success', ...titleOrOpts }),
    error:   (titleOrOpts, message) => typeof titleOrOpts === 'string'
      ? push({ type: 'error', title: titleOrOpts, message, duration: 6000 })
      : push({ type: 'error', duration: 6000, ...titleOrOpts }),
    warning: (titleOrOpts, message) => typeof titleOrOpts === 'string'
      ? push({ type: 'warning', title: titleOrOpts, message })
      : push({ type: 'warning', ...titleOrOpts }),
    info:    (titleOrOpts, message) => typeof titleOrOpts === 'string'
      ? push({ type: 'info', title: titleOrOpts, message })
      : push({ type: 'info', ...titleOrOpts }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="region" aria-label="Notificaciones">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item ${t.type} ${t.leaving ? 'leaving' : ''}`}>
            <div className="toast-icon">
              {t.type === 'success' && <CheckCircle size={14} />}
              {t.type === 'error'   && <AlertCircle size={14} />}
              {t.type === 'warning' && <AlertTriangle size={14} />}
              {t.type === 'info'    && <Info size={14} />}
            </div>
            <div className="toast-body">
              {t.title && <div className="toast-title">{t.title}</div>}
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
            <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Cerrar">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
