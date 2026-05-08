import React from 'react';
import { useAllTracks } from '../hooks/useIndexedDb';
import SearchBar from '../components/SearchBar';
import SongList from '../components/SongList';
import { usePlayer } from '../hooks/usePlayer';
import { addTracksToPlaylist, createPlaylist, exportLibrary, importLibrary } from '../db/indexedDb';
import type { Track } from '../types';

export default function Songs() {
  const tracks = useAllTracks() || [];
  const { playQueue, enqueue } = usePlayer();
  const [q, setQ] = React.useState('');
  const [sort, setSort] = React.useState<'title' | 'artist' | 'album' | 'duration'>('title');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const filtered = React.useMemo<Track[]>(() => {
    const s = q.trim().toLowerCase();
    const arr: Track[] = s
      ? tracks.filter((t: Track) =>
          [t.title, t.artist, t.album].some((f) => (f || '').toLowerCase().includes(s)),
        )
      : tracks.slice();
    arr.sort((a: Track, b: Track) => {
      if (sort === 'duration') return (a.duration || 0) - (b.duration || 0);
      const av = String((a as any)[sort] || '');
      const bv = String((b as any)[sort] || '');
      return av.localeCompare(bv);
    });
    return arr;
  }, [tracks, q, sort]);

  function toggleSelect(id: string) {
    setSelected((prev: Set<string>) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function createPlaylistFromSelection() {
    if (!selected.size) return;
    const name = prompt('Playlist name?');
    if (!name) return;
    const id = await createPlaylist(name);
    await addTracksToPlaylist(id, Array.from(selected));
    alert('Added to playlist');
  }

  async function handleExport() {
    const blob = await exportLibrary();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-library.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      await importLibrary(json);
      alert('Library imported');
    } catch (e) {
      alert('Import failed');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">All Songs</h1>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBar value={q} onChange={setQ} placeholder="Search songs" />
          <select className="input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="album">Album</option>
            <option value="duration">Duration</option>
          </select>
          <button className="btn-ghost" onClick={() => enqueue(Array.from(selected))} disabled={!selected.size}>+ Queue</button>
          <button className="btn-ghost" onClick={createPlaylistFromSelection} disabled={!selected.size}>+ Playlist</button>
          <button className="btn-ghost" onClick={handleExport}>Export</button>
          <label className="btn-ghost cursor-pointer">
            Import
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <SongList
        tracks={filtered}
        onPlay={(id) => playQueue(filtered.map((t) => t.id), filtered.findIndex((t) => t.id === id))}
        onToggleSelect={toggleSelect}
        selected={selected}
      />
    </div>
  );
}
