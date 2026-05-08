import React from 'react';
import { gradientPlaceholderDataUrl } from '../lib/audio';
import { db } from '../db/indexedDb';

export default function Artwork({ blobId, title, artist, className = '' }: { blobId?: string; title: string; artist: string; className?: string; }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!blobId) return;
      const b = await db.blobs.get(blobId);
      if (b && alive) setUrl(URL.createObjectURL(b.blob));
    })();
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [blobId]);
  const fallback = gradientPlaceholderDataUrl(`${title}-${artist}`, title, artist);
  return (
    <img
      src={url || fallback}
      alt={title}
      className={`object-cover ${className}`}
    />
  );
}
