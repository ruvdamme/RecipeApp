/**
 * Recipes API Client
 * All calls go through here.
 */

const BASE_URL = 'http://127.0.0.1:8080'; // for production

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// ─── Recipes ────────────────────────────────────────────────────────────────

/** GET /recipes → RecipeSummary[] */
export const getRecipes = () => request('/recipes');

/** GET /recipes/:id → Recipe (with screenshots) */
export const getRecipe = (id) => request(`/recipes/${id}`);

/**
 * POST /recipes (multipart)
 * @param {{ name: string, notes?: string, url?: string, picture?: File }} data
 */
export const createRecipe = (data) => {
  const form = new FormData();
  form.append('name', data.name);
  if (data.notes) form.append('notes', data.notes);
  if (data.url)   form.append('url', data.url);
  if (data.picture) form.append('picture', data.picture);
  return request('/recipes', { method: 'POST', body: form });
};

/** DELETE /recipes/:id */
export const deleteRecipe = (id) =>
  request(`/recipes/${id}`, { method: 'DELETE' });

/** POST /recipes/reorder – ids: number[] in new order */
export const reorderRecipes = (ids) =>
  request('/recipes/reorder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });

// ─── Recipe fields ───────────────────────────────────────────────────────────

export const updateName  = (id, name)  => request(`/recipes/${id}/name`,  { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name })  });
export const updateNotes = (id, notes) => request(`/recipes/${id}/notes`, { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ notes }) });
export const updateUrl   = (id, url)   => request(`/recipes/${id}/url`,   { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ url })   });

// ─── Picture ─────────────────────────────────────────────────────────────────

/** PUT /recipes/:id/picture – file: File */
export const updatePicture = (id, file) => {
  const form = new FormData();
  form.append('picture', file);
  return request(`/recipes/${id}/picture`, { method: 'PUT', body: form });
};

/** DELETE /recipes/:id/picture */
export const deletePicture = (id) =>
  request(`/recipes/${id}/picture`, { method: 'DELETE' });

// ─── Screenshots ─────────────────────────────────────────────────────────────

/** POST /recipes/:id/screenshots – file: File */
export const addScreenshot = (id, file) => {
  const form = new FormData();
  form.append('screenshot', file);
  return request(`/recipes/${id}/screenshots`, { method: 'POST', body: form });
};

/** DELETE /recipes/:id/screenshots/:sid */
export const deleteScreenshot = (id, sid) =>
  request(`/recipes/${id}/screenshots/${sid}`, { method: 'DELETE' });

/** POST /recipes/:id/screenshots/reorder – ids: number[] */
export const reorderScreenshots = (id, ids) =>
  request(`/recipes/${id}/screenshots/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
