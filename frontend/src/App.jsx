import { useState, useEffect } from 'react';
import RecipeList from './pages/RecipeList';
import RecipeDetail from './pages/RecipeDetail';

function getIdFromUrl() {
  const match = window.location.pathname.match(/^\/recipes\/(\d+)/);
  return match ? Number(match[1]) : null;
}

export default function App() {
  const [selectedId, setSelectedId] = useState(getIdFromUrl);

  // Navigate to a recipe — push a real history entry so back works
  function openRecipe(id) {
    window.history.pushState({ id }, '', `/recipes/${id}`);
    setSelectedId(id);
  }

  // Go back via the browser history stack (works on phone too)
  function goBack() {
    window.history.back();
  }

  // React to browser back / forward buttons
  useEffect(() => {
    function onPop() {
      setSelectedId(getIdFromUrl());
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return selectedId
    ? <RecipeDetail id={selectedId} onBack={goBack} />
    : <RecipeList onSelect={openRecipe} />;
}
