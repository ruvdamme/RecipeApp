import { useState } from 'react';
import { useRecipes } from '../hooks/useRecipes';
import { useDragReorder } from '../hooks/useDragReorder';
import * as api from '../api/client';
import { Button, Card, Modal, Input, Textarea, ImageUpload, Spinner, Toast } from '../components/UI';

const PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23222' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23444' font-size='32'%3E🍽%3C/text%3E%3C/svg%3E";

export default function RecipeList({ onSelect }) {
  const { data: recipes, loading, error, refetch } = useRecipes();
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', notes: '', url: '', picture: null });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  }

  // ─── Drag reorder ───────────────────────────────────────────────────────────
  const { items: orderedRecipes, setItems, dragHandlers, isDragging } = useDragReorder(
    recipes ?? [],
    async (ids) => {
      try { await api.reorderRecipes(ids); }
      catch { showToast('Reorder failed', 'error'); refetch(); }
    }
  );



  // ─── Create ─────────────────────────────────────────────────────────────────
  function handlePictureFile(file) {
    setForm(f => ({ ...f, picture: file }));
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.createRecipe(form);
      refetch();
      setCreating(false);
      setForm({ name: '', notes: '', url: '', picture: null });
      setPreviewUrl(null);
      showToast('Recipe created!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ─── Delete ─────────────────────────────────────────────────────────────────
  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this recipe?')) return;
    try {
      await api.deleteRecipe(id);
      refetch();
      showToast('Deleted.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg)]/80 backdrop-blur-xl border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍳</span>
          <span className="font-display text-xl font-bold tracking-tight text-[var(--text)]">Recipes</span>
        </div>
        <Button onClick={() => setCreating(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          New Recipe
        </Button>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center py-32 text-[var(--text-muted)]">
            <Spinner size={28} />
          </div>
        )}
        {error && (
          <div className="text-center py-32 text-red-400">
            <p className="text-lg">Could not load recipes</p>
            <p className="text-sm mt-1 opacity-70">{error}</p>
          </div>
        )}
        {!loading && !error && orderedRecipes.length === 0 && (
          <div className="text-center py-32 text-[var(--text-muted)]">
            <p className="text-5xl mb-4">🍽</p>
            <p className="text-lg font-medium">No recipes yet</p>
            <p className="text-sm mt-1">Create your first one above</p>
          </div>
        )}

        {/* Drag hint */}
        {!loading && orderedRecipes.length > 1 && (
          <p className="text-xs text-[var(--text-muted)] mb-4 text-center">
            Drag cards to reorder
          </p>
        )}

        {/* Recipe Grid */}
        {!loading && (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 ${isDragging ? 'cursor-grabbing' : ''}`}>
            {orderedRecipes.map((r, index) => (
              <div
                key={r.id}
                {...dragHandlers(index)}
                className={`transition-opacity duration-150 ${isDragging ? 'opacity-80' : ''}`}
              >
                <Card
                  onClick={() => !isDragging && onSelect(r.id)}
                  className="group relative cursor-grab active:cursor-grabbing select-none"
                >
                  {/* Drag grip indicator */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-60 transition-opacity text-white drop-shadow">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                  </div>

                  {/* Picture */}
                  <div className="aspect-square overflow-hidden bg-[var(--surface-2)]">
                    <img
                      src={r.picture || PLACEHOLDER}
                      alt={r.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    />
                  </div>

                  {/* Name + delete */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium leading-tight truncate">{r.name}</span>
                    <button
                      onClick={(e) => handleDelete(e, r.id)}
                      className="text-[var(--text-muted)] hover:text-red-400 flex-shrink-0 transition-colors"
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <Modal open={creating} onClose={() => { setCreating(false); setPreviewUrl(null); }} title="New Recipe">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <ImageUpload onFile={handlePictureFile} className="w-full">
            <div className="w-full h-36 rounded-xl bg-[var(--surface-2)] border border-dashed border-[var(--border)] flex items-center justify-center overflow-hidden hover:border-[var(--accent)] transition-colors">
              {previewUrl
                ? <img src={previewUrl} className="w-full h-full object-cover rounded-xl" alt="preview" />
                : <span className="text-sm text-[var(--text-muted)]">Click to add picture</span>
              }
            </div>
          </ImageUpload>

          <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Grandma's Lasagna" required />
          <Input label="URL" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes…" />

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.name.trim()}>
              {saving && <Spinner size={14} />}
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
