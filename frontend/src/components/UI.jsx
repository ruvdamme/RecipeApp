import { useRef } from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-hover)]',
    ghost:   'bg-transparent text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
    danger:  'bg-transparent text-red-400 hover:bg-red-400/10 border border-red-400/30',
    outline: 'bg-transparent border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{label}</label>}
      <input
        className={`bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{label}</label>}
      <textarea
        rows={4}
        className={`bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none ${className}`}
        {...props}
      />
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── ImageUpload ──────────────────────────────────────────────────────────────
export function ImageUpload({ onFile, children, className = '' }) {
  const ref = useRef();
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])}
      />
      <div onClick={() => ref.current.click()} className={`cursor-pointer ${className}`}>
        {children}
      </div>
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Toast (simple) ───────────────────────────────────────────────────────────
export function Toast({ message, type = 'success' }) {
  if (!message) return null;
  const colors = { success: 'bg-emerald-500', error: 'bg-red-500' };
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] ${colors[type]} text-white text-sm px-5 py-2.5 rounded-full shadow-lg animate-slide-up`}>
      {message}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-[var(--accent)]/50 hover:shadow-lg hover:-translate-y-0.5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
