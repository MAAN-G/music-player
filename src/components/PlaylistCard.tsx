import React from 'react';
import { Link } from 'react-router-dom';

export default function PlaylistCard({ id, name, count, onDelete }: { id: string; name: string; count: number; onDelete?: () => void; }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <Link to={`/playlists/${id}`} className="font-semibold hover:underline">{name}</Link>
        <div className="flex items-center gap-2 text-sm opacity-80">
          <span>{count} tracks</span>
          <button className="btn-ghost" onClick={onDelete} aria-label="Delete playlist">🗑️</button>
        </div>
      </div>
    </div>
  );
}
