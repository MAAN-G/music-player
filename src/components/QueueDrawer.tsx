import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { useTrackById } from '../hooks/useIndexedDb';

export default function QueueDrawer() {
  const { queue, index, removeAt, reorderQueue, setQueueOpen, clearQueue } = usePlayer();

  function onDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.dataTransfer.setData('text/plain', String(i));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>, to: number) {
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(from)) reorderQueue(from, to);
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/30" aria-modal role="dialog" onClick={() => setQueueOpen(false)}>
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[70%] overflow-y-auto rounded-t-xl bg-white p-4 shadow-2xl dark:bg-neutral-900 md:left-auto md:top-0 md:bottom-0 md:h-full md:w-[360px] md:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 id="queue-title" className="text-lg font-semibold">Queue</h2>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={clearQueue} disabled={!queue.length} aria-label="Clear queue">🧹 Clear</button>
            <button className="btn-ghost" onClick={() => setQueueOpen(false)} aria-label="Close queue">✖️</button>
          </div>
        </div>
        <div className="space-y-2">
          {queue.map((id, i) => (
            <QueueItem
              key={id + i}
              id={id}
              active={i === index}
              onDragStart={(e) => onDragStart(e, i)}
              onDrop={(e) => onDrop(e, i)}
              onRemove={() => removeAt(i)}
            />
          ))}
          {queue.length === 0 && <div className="opacity-60">Queue is empty</div>}
        </div>
      </div>
    </div>
  );
}

function QueueItem({ id, active, onDragStart, onDrop, onRemove }: any) {
  const track = useTrackById(id);
  return (
    <div
      className={`card flex items-center gap-3 p-2 ${active ? 'ring-2 ring-accent' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="h-10 w-10 rounded bg-[hsl(var(--muted))]" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{track?.title || '—'}</div>
        <div className="truncate text-xs opacity-70">{track ? `${track.artist} — ${track.album}` : '—'}</div>
      </div>
      <button className="btn-ghost" onClick={onRemove} aria-label="Remove from queue">🗑️</button>
    </div>
  );
}
