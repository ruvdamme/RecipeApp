import { useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

// ─── Generic async hook ───────────────────────────────────────────────────────
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const run = useCallback(async () => {
    // On the initial load (no data yet) show loading spinner.
    // On refetch, keep existing data visible — no spinner, no scroll jump.
    setState(s => ({ ...s, loading: s.data === null, error: null }));

    // Save scroll position before data swap
    const scrollY = window.scrollY;

    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
      // Restore scroll after React re-renders
      requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' }));
    } catch (e) {
      setState(s => ({ ...s, loading: false, error: e.message }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { run(); }, [run]);
  return { ...state, refetch: run };
}

// ─── Recipes list ─────────────────────────────────────────────────────────────
export function useRecipes() {
  return useAsync(() => api.getRecipes());
}

// ─── Single recipe ────────────────────────────────────────────────────────────
export function useRecipe(id) {
  return useAsync(() => api.getRecipe(id), [id]);
}