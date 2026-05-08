import React from 'react';
import { Track } from '../types';
import Artwork from './Artwork';

export default function SongList({ tracks, onPlay, onToggleSelect, selected }: {
  tracks: Track[];
  onPlay: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  selected?: Set<string>;
}) {
  return (
    <div className="divide-y divide-[hsl(var(--muted))]">
      {tracks.map((t) => (
        <div key={t.id} className="flex items-center gap-3 py-2">
          {onToggleSelect && (
            <input
              aria-label={`Select ${t.title}`}
              type="checkbox"
              checked={!!selected?.has(t.id)}
              onChange={() => onToggleSelect?.(t.id)}
              className="h-4 w-4"
            />
          )}
          <button
            className="btn-ghost"
            onClick={() => onPlay(t.id)}
            aria-label={`Play ${t.title}`}
            title="Play"
          >
            ▶️
          </button>
          <Artwork
            blobId={t.artworkBlobId}
            title={t.title}
            artist={t.artist}
            className="h-12 w-12 rounded"
          />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{t.title}</div>
            <div className="truncate text-sm opacity-70">{t.artist} — {t.album}</div>
          </div>
          <div className="tabular-nums text-sm opacity-70 w-12 text-right">{Math.floor(t.duration/60)}:{String(Math.floor(t.duration%60)).padStart(2,'0')}</div>
        </div>
      ))}
      {tracks.length === 0 && <div className="py-8 text-center opacity-70">No songs yet</div>}
    </div>
  );
}
