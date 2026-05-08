import React from 'react';
import { usePlaylists } from '../hooks/useIndexedDb';
import PlaylistCard from '../components/PlaylistCard';
import { createPlaylist, deletePlaylist } from '../db/indexedDb';
import type { Playlist } from '../types';

export default function Playlists() {
  const playlists = (usePlaylists() || []) as Playlist[];

  async function onCreate() {
    const name = prompt('New playlist name?');
    if (!name) return;
    await createPlaylist(name);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Playlists</h1>
        <button className="btn-primary" onClick={onCreate}>+ New</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {playlists.map((p: Playlist) => (
          <PlaylistCard key={p.id} id={p.id} name={p.name} count={p.trackIds.length} onDelete={() => deletePlaylist(p.id)} />
        ))}
        {playlists.length === 0 && <div className="opacity-70">No playlists yet</div>}
      </div>
    </div>
  );
}
