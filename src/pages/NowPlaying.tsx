import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import Artwork from '../components/Artwork';

export default function NowPlaying() {
  const { current, isPlaying, toggle, prev, next, seek, currentTime, duration, shuffle, setShuffle, repeat, setRepeat, queue, index } = usePlayer();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">Now Playing</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex items-center justify-center">
          <Artwork
            blobId={current?.artworkBlobId}
            title={current?.title || '—'}
            artist={current?.artist || ''}
            className="h-72 w-72 rounded-xl shadow-lg"
          />
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xl font-semibold">{current?.title || 'Nothing playing'}</div>
            <div className="opacity-80">{current ? `${current.artist} — ${current.album}` : '—'}</div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-80">
            <span className="tabular-nums">{Math.floor(currentTime/60)}:{String(Math.floor(currentTime%60)).padStart(2,'0')}</span>
            <input
              aria-label="Seek"
              className="w-full"
              type="range"
              min={0}
              max={Math.max(1, duration)}
              step={1}
              value={Math.min(duration, Math.floor(currentTime))}
              onChange={(e) => seek(Number(e.target.value))}
            />
            <span className="tabular-nums">{Math.floor(duration/60)}:{String(Math.floor(duration%60)).padStart(2,'0')}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className={`btn-ghost ${shuffle ? 'underline' : ''}`} onClick={() => setShuffle(!shuffle)} aria-pressed={shuffle} aria-label="Shuffle">🔀 Shuffle</button>
            <button className={`btn-ghost ${repeat !== 'off' ? 'underline' : ''}`} onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')} aria-label="Repeat">🔁 Repeat: {repeat}</button>
          </div>
          <div className="flex items-center gap-3">
            <button aria-label="Previous" className="btn-ghost" onClick={prev}>⏮️</button>
            <button aria-label={isPlaying ? 'Pause' : 'Play'} className="btn-primary" onClick={toggle}>{isPlaying ? '⏸️' : '▶️'}</button>
            <button aria-label="Next" className="btn-ghost" onClick={next}>⏭️</button>
          </div>
          <div className="text-sm opacity-70">Up next: {queue.slice(index + 1, index + 4).length ? queue.slice(index + 1, index + 4).length + ' tracks' : '—'}</div>
        </div>
      </div>
    </div>
  );
}
