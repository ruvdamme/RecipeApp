import { useState, useRef } from 'react';

/**
 * useDragReorder
 * Manages local drag-and-drop reordering of a list.
 *
 * Usage:
 *   const { items, dragHandlers, isDragging } = useDragReorder(initialItems, onReorderEnd);
 *
 * - items:          current (possibly reordered) list — use this to render
 * - dragHandlers:   spread onto each draggable element as {...dragHandlers(index)}\n * - isDragging:     true while a drag is active (useful for cursor/style)
 * - onReorderEnd:   called with the new id order once the user drops
 */
export function useDragReorder(initialItems, onReorderEnd) {
  const [items, setItems] = useState(initialItems);
  const dragIndex = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Always-current ref so onDragEnd never reads a stale closure
  const itemsRef = useRef(items);
  const setItemsAndRef = (next) => {
    const resolved = typeof next === 'function' ? next(itemsRef.current) : next;
    itemsRef.current = resolved;
    setItems(resolved);
  };

  // Keep items in sync when the source data changes (e.g. after refetch).
  // Compare *sorted* ID sets so a drag-reorder (same IDs, different order)
  // does NOT trigger a reset — only actual additions/deletions do.
  if (!isDragging && initialItems) {
    const sorted    = [...itemsRef.current].map(i => i.id).sort().join(',');
    const newSorted = [...initialItems].map(i => i.id).sort().join(',');
    if (sorted !== newSorted) setItemsAndRef(initialItems);
  }

  function dragHandlers(index) {
    return {
      draggable: true,
      onDragStart(e) {
        dragIndex.current = index;
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
      },
      onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragIndex.current === null || dragIndex.current === index) return;
        setItemsAndRef(prev => {
          const next = [...prev];
          const [moved] = next.splice(dragIndex.current, 1);
          next.splice(index, 0, moved);
          dragIndex.current = index;
          return next;
        });
      },
      onDragEnd() {
        setIsDragging(false);
        dragIndex.current = null;
        // itemsRef.current is always up-to-date — no stale closure
        onReorderEnd(itemsRef.current.map(i => i.id));
      },
    };
  }

  return { items, setItems: setItemsAndRef, dragHandlers, isDragging };
}