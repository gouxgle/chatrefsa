import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, Plus, X } from 'lucide-react';
import api from '../../api/axios';

export default function StickerPicker({ onSend, onClose }) {
  const [packs, setPacks] = useState({});
  const [activePack, setActivePack] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadPack, setUploadPack] = useState('General');
  const [uploadName, setUploadName] = useState('');
  const fileRef = useRef(null);

  const fetchStickers = async () => {
    try {
      const { data } = await api.get('/stickers');
      setPacks(data.packs);
      if (!activePack && Object.keys(data.packs).length > 0) {
        setActivePack(Object.keys(data.packs)[0]);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchStickers(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('sticker', file);
    formData.append('pack', uploadPack);
    formData.append('name', uploadName || file.name.replace(/\.[^.]+$/, ''));
    try {
      await api.post('/stickers', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchStickers();
      setShowUpload(false);
      setUploadName('');
    } catch { /* ignore */ }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/stickers/${id}`);
      await fetchStickers();
    } catch { /* ignore */ }
  };

  const packNames = Object.keys(packs);
  const activeStickers = activePack ? (packs[activePack] || []) : [];

  return (
    <div className="sticker-picker-wrapper">
      <div className="sticker-picker">
        <div className="sticker-picker-header">
          <div className="sticker-picker-tabs">
            {packNames.map(p => (
              <button key={p} className={`sticker-tab ${activePack === p ? 'active' : ''}`} onClick={() => { setActivePack(p); setShowUpload(false); }}>
                {p}
              </button>
            ))}
            <button className={`sticker-tab ${showUpload ? 'active' : ''}`} onClick={() => setShowUpload(true)} title="Agregar sticker">
              <Plus size={14} />
            </button>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ flexShrink: 0 }}><X size={16} /></button>
        </div>

        <div className="sticker-picker-body">
          {showUpload ? (
            <div className="sticker-upload-form">
              <div className="sticker-upload-title">Agregar sticker</div>
              <input
                className="sticker-upload-input"
                type="text"
                placeholder="Nombre del sticker"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
              />
              <input
                className="sticker-upload-input"
                type="text"
                placeholder="Pack (ej: Trabajo, Emociones...)"
                value={uploadPack}
                onChange={e => setUploadPack(e.target.value)}
              />
              <button
                className="btn btn-primary sticker-upload-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload size={15} />
                {uploading ? 'Subiendo...' : 'Elegir imagen (PNG, GIF, WebP)'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleUpload} />
              <div className="sticker-upload-hint">Máximo 2 MB · PNG, GIF, WebP, JPG</div>
            </div>
          ) : activeStickers.length === 0 ? (
            <div className="sticker-empty">
              No hay stickers en este pack.
              <button className="btn btn-secondary" style={{ marginTop: 8, fontSize: '0.75rem' }} onClick={() => setShowUpload(true)}>
                <Plus size={12} /> Agregar
              </button>
            </div>
          ) : (
            <div className="sticker-grid">
              {activeStickers.map(s => (
                <div key={s.id} className="sticker-item" onClick={() => onSend(s)} title={s.name}>
                  <img src={`/uploads/stickers/${s.filename}`} alt={s.name} loading="lazy" />
                  <button className="sticker-delete-btn" onClick={(e) => handleDelete(s.id, e)} title="Eliminar">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
