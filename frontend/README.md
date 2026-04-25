# Recipes Frontend

A minimal, app-like React frontend for the Go recipes API.

## Setup

```bash
npm install
npm run dev        # → http://localhost:3000
```

The Vite dev server proxies `/recipes/*` to `http://localhost:8080` automatically.
No CORS config needed in dev.

## Production

```bash
npm run build      # outputs to /dist
```

Serve `dist/` from your Go server or any static host.
Update `BASE_URL` in `src/api/client.js` if your API lives elsewhere.

---

## Project structure

```
src/
├── api/
│   └── client.js          ← ALL api calls live here. One function per endpoint.
│
├── hooks/
│   └── useRecipes.js      ← useAsync, useRecipes, useRecipe
│
├── components/
│   └── UI.jsx             ← Button, Input, Textarea, Modal, Toast, Card,
│                             Spinner, ImageUpload
│
├── pages/
│   ├── RecipeList.jsx     ← Grid of cards + create modal
│   └── RecipeDetail.jsx   ← Full recipe view with inline editing
│
├── App.jsx                ← Router (just state: selectedId or null)
├── main.jsx
└── index.css              ← Design tokens (CSS vars) + Google Fonts
```

## How to add a new API call

1. Add a function to `src/api/client.js`
2. (Optional) add a hook to `src/hooks/useRecipes.js` if you need polling/refetch
3. Call it from your page with `await api.yourFunction()`

## Changing the backend URL

Edit the top of `src/api/client.js`:
```js
const BASE_URL = 'http://localhost:8080';  // ← change this
```

Or use Vite's proxy (already configured) and set `BASE_URL = ''`.
