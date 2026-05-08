import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlaylist } from '../hooks/useIndexedDb';
import { addTracksToPlaylist, db, removeTrackFromPlaylist, reorderPlaylist, renamePlaylist } from '../db/indexedDb';
import { usePlayer } from '../hooks/usePlayer';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playlist = usePlaylist(id);
  const { playQueue } = usePlayer();

  if (!playlist) return <div>Loading…</div>;

  async function onRename() {
    const name = prompt('Rename playlist', playlist.name);
    if (name && id) await renamePlaylist(id, name);
  }

  async function onDelete() {
    if (confirm('Delete playlist?')) {
      await (await import('../db/indexedDb')).deletePlaylist(id!);
      navigate('/playlists');
    }
  }

  function onDragStart(e: React.DragEvent<HTMLDivElement>, i: number) {
    e.dataTransfer.setData('text/plain', String(i));
    e.dataTransfer.effectAllowed = 'move';
  }
  async function onDrop(e: React.DragEvent<HTMLDivElement>, to: number) {
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (!Number.isNaN(from) && id) await reorderPlaylist(id, from, to);
  }

  async function onAddAllToQueue() {
    await playQueue(playlist.trackIds, 0);
  }

  async function onRemove(tid: string) {
    if (!id) return;
    await removeTrackFromPlaylist(id, tid);
  }

  async function onAddAllToAnother() {
    const name = prompt('Add all to playlist (new name)?');
    if (!name || !id) return;
    const newId = await (await import('../db/indexedDb')).createPlaylist(name);
    await addTracksToPlaylist(newId, playlist.trackIds);
    alert('Copied to new playlist');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-semibold">{playlist.name}</h1>
        <button className="btn-ghost" onClick={onRename}>Rename</button>
        <button className="btn-ghost" onClick={onDelete}>Delete</button>
        <button className="btn-ghost" onClick={onAddAllToQueue}>Play All</button>
        <button className="btn-ghost" onClick={onAddAllToAnother}>Copy To…</button>
      </div>

      <div className="space-y-2">
        {playlist.trackIds.map((tid, i) => (
          <PlaylistItem
            key={tid + i}
            id={tid}
            onRemove={() => onRemove(tid)}
            onDragStart={(e) => onDragStart(e, i)}
            onDrop={(e) => onDrop(e, i)}
          />
        ))}
        {playlist.trackIds.length === 0 && <div className="opacity-70">Empty playlist</div>}
      </div>
    </div>
  );
}

function PlaylistItem({ id, onRemove, onDragStart, onDrop }: any) {
  const [track, setTrack] = React.useState<any>(null);
  React.useEffect(() => { (async () => setTrack(await db.tracks.get(id)))(); }, [id]);
  if (!track) return null;
  return (
    <div
      className="card flex items-center gap-3 p-2"
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="h-12 w-12 rounded bg-[hsl(var(--muted))]" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{track.title}</div>
        <div className="truncate text-sm opacity-70">{track.artist} — {track.album}</div>
      </div>
      <button className="btn-ghost" onClick={onRemove} aria-label="Remove from playlist">🗑️</button>
    </div>
  );
}
