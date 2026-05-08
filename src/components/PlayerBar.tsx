import React from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { formatTime } from '../lib/audio';
import { Link } from 'react-router-dom';

export default function PlayerBar() {
  const {
    current,
    isPlaying,
    currentTime,
    duration,
    toggle,
    next,
    prev,
    seek,
    timeLabel,
    setQueueOpen,
  } = usePlayer();

  return (
    <div className="sticky bottom-0 z-30 border-t border-[hsl(var(--muted))] bg-white/80 dark:bg-neutral-900/80 backdrop-blur">
      <div className="container mx-auto flex flex-col gap-2 px-4 py-2 md:flex-row md:items-center md:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-12 w-12 overflow-hidden rounded bg-[hsl(var(--muted))]">
            {current?.artworkBlobId ? (
              <ArtworkThumb blobId={current.artworkBlobId} />
            ) : (
              <img alt="art" src="/icons/app-icon.svg" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{current ? current.title : 'Nothing playing'}</div>
            <div className="truncate text-xs opacity-70">{current ? `${current.artist} — ${current.album}` : '—'}</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 md:order-2">
          <div className="flex items-center gap-3">
            <button aria-label="Previous" className="btn-ghost" onClick={prev}>
              ⏮️
            </button>
            <button aria-label={isPlaying ? 'Pause' : 'Play'} className="btn-primary" onClick={toggle}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button aria-label="Next" className="btn-ghost" onClick={next}>
              ⏭️
            </button>
          </div>
          <div className="flex w-full max-w-xl items-center gap-2 text-xs opacity-80">
            <span className="tabular-nums">{formatTime(currentTime)}</span>
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
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:ml-auto md:order-3">
          <button aria-label="Toggle Queue" className="btn-ghost" onClick={() => setQueueOpen(true)}>
            🧾 Queue
          </button>
          <Link to="/now-playing" className="btn-ghost">Open Player</Link>
        </div>
      </div>
    </div>
  );
}

function ArtworkThumb({ blobId }: { blobId: string }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const art = await (await import('../db/indexedDb')).db.blobs.get(blobId);
      if (art && alive) {
        const u = URL.createObjectURL(art.blob);
        setUrl(u);
      }
    })();
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [blobId]);
  if (!url) return <div className="h-full w-full bg-[hsl(var(--muted))]" />;
  return <img src={url} alt="art" className="h-full w-full object-cover" />;
}
