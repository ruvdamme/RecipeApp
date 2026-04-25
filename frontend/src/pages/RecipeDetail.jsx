import { useState, useEffect, useRef, useCallback } from 'react';
import { useRecipe } from '../hooks/useRecipes';
import { useDragReorder } from '../hooks/useDragReorder';
import * as api from '../api/client';
import { Button, Input, Textarea, ImageUpload, Spinner, Toast } from '../components/UI';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect fill='%231a1a1a' width='200' height='200'/%3E%3Ctext x='100' y='115' text-anchor='middle' fill='%23333' font-size='64'%3E🍽%3C/text%3E%3C/svg%3E";

// ─── Global styles for the <dialog> lightbox (injected once) ─────────────────
const LIGHTBOX_CSS = `
  dialog.lb {
    border: none;
    padding: 0;
    margin: 0;
    width: 100dvw;
    max-width: 100dvw;
    height: 100dvh;
    max-height: 100dvh;
    background: #000;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.22s ease;
  }
  dialog.lb[open] { opacity: 1; }
  dialog.lb::backdrop { background: transparent; }

  @keyframes lb-in {
    from { opacity: 0; transform: scale(0.96); }
    to   { opacity: 1; transform: scale(1); }
  }
  .lb-img { animation: lb-in 0.18s ease both; }

  .lb-btn {
    border: none;
    cursor: pointer;
    background: rgba(255,255,255,0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s ease;
  }
  .lb-btn:hover { background: rgba(255,255,255,0.2); }
  .lb-btn:active { background: rgba(255,255,255,0.3); }
`;

function ensureLightboxCSS() {
  if (document.getElementById('lb-style')) return;
  const el = document.createElement('style');
  el.id = 'lb-style';
  el.textContent = LIGHTBOX_CSS;
  document.head.appendChild(el);
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
// Uses the native <dialog> element — handles focus trap, Escape key, backdrop,
// and accessibility out of the box. No fixed/z-index stacking issues.
function Lightbox({ screenshots, startIndex, onClose }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(startIndex);
  const [stamp, setStamp] = useState(0); // bumped to re-trigger img animation
  const total = screenshots.length;

  const go = useCallback((dir) => {
    setIdx(i => (i + dir + total) % total);
    setStamp(s => s + 1);
  }, [total]);

  // Open dialog and lock scroll
  useEffect(() => {
    ensureLightboxCSS();
    const el = ref.current;
    if (!el) return;
    el.showModal();
    const saved = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = saved; };
  }, []);

  // Register this lightbox as "open" so App.jsx's popstate handler knows
  // to close us instead of navigating away from the recipe.
  // Use a ref to avoid re-running when onClose identity changes each render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    window.__lightboxClose = () => onCloseRef.current();
    return () => { window.__lightboxClose = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Native Escape fires 'cancel' on the dialog
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = (e) => { e.preventDefault(); onClose(); };
    el.addEventListener('cancel', h);
    return () => el.removeEventListener('cancel', h);
  }, [onClose]);

  // Arrow key navigation
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [go]);

  // Click the dark backdrop area → close
  function onDialogClick(e) {
    if (e.target === ref.current) onClose();
  }

  // Swipe
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) >= 40) go(dx < 0 ? 1 : -1);
  };

  const src = screenshots[idx].url;

  return (
    <dialog
      ref={ref}
      className="lb"
      style={{ colorScheme: 'dark' }}
      onClick={onDialogClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Gradient top bar */}
      <div style={{
        position: 'absolute', inset: '0 0 auto 0', zIndex: 2,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
          {idx + 1} / {total}
        </span>
        {/* Close sits in the bar but needs pointer events */}
        <button
          className="lb-btn"
          onClick={onClose}
          style={{ width: 40, height: 40, pointerEvents: 'all' }}
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Image stage — flex centers the image, nav buttons float inside */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '64px 0 52px',
      }}>
        <img
          key={stamp}
          src={src}
          alt=""
          className="lb-img"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            borderRadius: 6,
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'block',
          }}
        />

        {total > 1 && (
          <>
            <button
              className="lb-btn"
              onClick={() => go(-1)}
              style={{ position: 'absolute', left: 10, width: 44, height: 44 }}
              aria-label="Previous"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <button
              className="lb-btn"
              onClick={() => go(1)}
              style={{ position: 'absolute', right: 10, width: 44, height: 44 }}
              aria-label="Next"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Gradient bottom bar with pill dots */}
      {total > 1 && (
        <div style={{
          position: 'absolute', inset: 'auto 0 0 0', zIndex: 2,
          padding: '0 16px 18px',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)',
        }}>
          {screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setStamp(s => s + 1); }}
              aria-label={`Go to image ${i + 1}`}
              style={{
                border: 'none',
                cursor: 'pointer',
                padding: '8px 3px',
                background: 'transparent',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{
                display: 'block',
                height: 3,
                borderRadius: 99,
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.28)',
                width: i === idx ? 22 : 6,
                transition: 'width 0.2s ease, background 0.2s ease',
              }}/>
            </button>
          ))}
        </div>
      )}
    </dialog>
  );
}

// ─── Inline editable field ────────────────────────────────────────────────────
function EditableField({ value, onSave, placeholder, multiline = false, label }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value || ''); }, [value]);

  async function save() {
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); setEditing(false); }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        {multiline
          ? <Textarea label={label} value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} rows={5} autoFocus />
          : <Input label={label} value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder} autoFocus />
        }
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving}>{saving ? <Spinner size={12}/> : 'Save'}</Button>
          <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(value || ''); }}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="group cursor-text rounded-lg py-1 hover:bg-[var(--surface-2)] transition-colors -mx-1 px-1"
    >
      {label && <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">{label}</p>}
      {draft
        ? <p className={`text-[var(--text)] ${multiline ? 'whitespace-pre-wrap text-sm leading-relaxed' : 'text-lg font-semibold'}`}>{draft}</p>
        : <p className="text-[var(--text-muted)] text-sm italic">{placeholder} <span className="text-xs opacity-50">(click to add)</span></p>
      }
    </div>
  );
}

// ─── Screenshot strip ─────────────────────────────────────────────────────────
function ScreenshotStrip({ recipeId, screenshots, onChanged }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const { items: ordered, dragHandlers, isDragging } = useDragReorder(
    screenshots ?? [],
    async (ids) => {
      try { await api.reorderScreenshots(recipeId, ids); }
      catch { onChanged(); }
    }
  );

  async function handleFiles(files) {
    if (!files?.length) return;
    setUploading(true);
    let done = 0;
    setUploadProgress(`0/${files.length}`);
    for (const file of files) {
      try {
        await api.addScreenshot(recipeId, file);
        done++;
        setUploadProgress(`${done}/${files.length}`);
      } catch { /* continue */ }
    }
    setUploading(false);
    setUploadProgress(null);
    onChanged();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Screenshots</p>
        {ordered.length > 1 && (
          <p className="text-xs text-[var(--text-muted)] opacity-60">Drag to reorder</p>
        )}
      </div>

      <div className={`flex gap-3 flex-wrap ${isDragging ? 'cursor-grabbing' : ''}`}>
        {ordered.map((s, index) => (
          <div
            key={s.id}
            {...dragHandlers(index)}
            className={`relative group w-28 h-20 rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] cursor-grab active:cursor-grabbing select-none transition-opacity ${isDragging ? 'opacity-75' : ''}`}
          >
            <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-70 transition-opacity text-white drop-shadow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9"  cy="6"  r="1.5"/><circle cx="15" cy="6"  r="1.5"/>
                <circle cx="9"  cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                <circle cx="9"  cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
              </svg>
            </div>

            <img src={s.url} alt="" className="w-full h-full object-cover pointer-events-none"/>

            <div
              className="absolute inset-0 hover:bg-white/5 transition-colors"
              onClick={() => { if (!isDragging) setLightboxIndex(index); }}
            />

            <button
              onClick={async (e) => { e.stopPropagation(); await api.deleteScreenshot(recipeId, s.id); onChanged(); }}
              className="absolute top-1 right-1 z-10 transition-opacity bg-black/60 rounded-full p-0.5 text-white hover:text-red-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ))}

        <div
          onClick={() => fileRef.current.click()}
          className="w-28 h-20 rounded-lg bg-[var(--surface-2)] border border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 hover:border-[var(--accent)] transition-colors cursor-pointer"
        >
          {uploading
            ? <><Spinner size={16}/>{uploadProgress && <span className="text-xs text-[var(--text-muted)]">{uploadProgress}</span>}</>
            : <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-muted)]">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                <span className="text-xs text-[var(--text-muted)]">Add</span>
              </>
          }
        </div>

        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={e => { handleFiles(Array.from(e.target.files)); e.target.value = ''; }}/>
      </div>

      {lightboxIndex !== null && ordered.length > 0 && (
        <Lightbox
          screenshots={ordered}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function RecipeDetail({ id, onBack }) {
  const { data: recipe, loading, error, refetch } = useRecipe(id);
  const [toast, setToast] = useState(null);
  const [picSaving, setPicSaving] = useState(false);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function handlePicture(file) {
    setPicSaving(true);
    try { await api.updatePicture(id, file); refetch(); showToast('Picture updated!'); }
    catch (err) { showToast(err.message, 'error'); }
    finally { setPicSaving(false); }
  }

  async function withToast(fn) {
    try { await fn(); refetch(); showToast('Saved!'); }
    catch (e) { showToast(e.message, 'error'); }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="font-display font-bold text-xl truncate">{recipe?.name || '…'}</span>
      </header>

      {loading && <div className="flex items-center justify-center py-32 text-[var(--text-muted)]"><Spinner size={28}/></div>}
      {error && (
        <div className="text-center py-32 text-red-400">
          <p>{error}</p>
          <Button className="mt-4" variant="outline" onClick={onBack}>← Back</Button>
        </div>
      )}

      {!loading && recipe && (
        <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
          <div className="relative w-full group">
            <ImageUpload onFile={handlePicture} className="w-full">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)]">
                <img src={recipe.picture || PLACEHOLDER} alt={recipe.name} className="w-full h-full object-cover"/>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium bg-black/50 px-4 py-2 rounded-full">
                    {picSaving ? 'Uploading…' : 'Change picture'}
                  </span>
                </div>
              </div>
            </ImageUpload>
            {recipe.picture && (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try { await api.deletePicture(id); refetch(); showToast('Picture removed.'); }
                  catch (err) { showToast(err.message, 'error'); }
                }}
                className="absolute top-2 right-2 transition-opacity bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
                title="Remove picture"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>

          <EditableField label="Name" value={recipe.name} placeholder="Recipe name"
            onSave={(name) => withToast(() => api.updateName(id, name))}/>

          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-1">Source URL</p>
            <EditableField value={recipe.url} placeholder="https://..."
              onSave={(url) => withToast(() => api.updateUrl(id, url))}/>
            {recipe.url && (
              <a href={recipe.url} target="_blank" rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline">
                Open link
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            )}
          </div>

          <EditableField label="Notes" value={recipe.notes} placeholder="Add notes, ingredients, steps…"
            multiline onSave={(notes) => withToast(() => api.updateNotes(id, notes))}/>

          <ScreenshotStrip
            key={(recipe.screenshots ?? []).map(s => s.id).join(',')}
            recipeId={id}
            screenshots={recipe.screenshots}
            onChanged={refetch}
          />

          <div className="pt-4 border-t border-[var(--border)]">
            <Button variant="danger" onClick={async () => {
              if (!confirm('Delete this recipe permanently?')) return;
              await api.deleteRecipe(id);
              onBack();
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
              Delete Recipe
            </Button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type}/>}
    </div>
  );
}
