import Dexie, { Table } from 'dexie';
import { AppSettings, BlobDoc, ID, Playlist, Track } from '../types';
import { parseAudioFile } from '../lib/id3';
import { computeHash } from '../lib/audio';

class MusicDB extends Dexie {
  tracks!: Table<Track, ID>;
  blobs!: Table<BlobDoc, ID>;
  playlists!: Table<Playlist, ID>;
  app!: Table<AppSettings, 'settings'>;

  constructor() {
    super('local-music-db');
    this.version(1).stores({
      tracks: 'id, title, artist, album, duration, createdAt, updatedAt, audioBlobId',
      blobs: 'id, type, createdAt',
      playlists: 'id, name, createdAt, updatedAt',
      app: 'id',
    });
  }
}

export const db = new MusicDB();

export async function getOrInitSettings(): Promise<AppSettings> {
  const existing = await db.app.get('settings');
  if (existing) return existing;
  const defaults: AppSettings = {
    id: 'settings',
    theme: 'system',
    shuffle: false,
    repeat: 'off',
    lastQueue: [],
    lastIndex: 0,
    lastPosition: 0,
  };
  await db.app.put(defaults);
  return defaults;
}

export async function saveSettings(patch: Partial<AppSettings>) {
  const curr = await getOrInitSettings();
  await db.app.put({ ...curr, ...patch });
}

export async function importFiles(
  files: File[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ imported: number; skipped: number; errors: number }> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let done = 0;
  for (const file of files) {
    try {
      const audioHash = await computeHash(file);
      const audioBlobId = `audio:${audioHash}`;
      const existingTrack = await db.tracks.where({ audioBlobId }).first();
      if (existingTrack) {
        skipped++;
        done++;
        onProgress?.(done, files.length);
        continue;
      }

      const meta = await parseAudioFile(file);

      if (!(await db.blobs.get(audioBlobId))) {
        const audioBlob: BlobDoc = { id: audioBlobId, type: 'audio', blob: file, createdAt: Date.now() };
        await db.blobs.put(audioBlob);
      }

      let artworkBlobId: string | undefined;
      if (meta.artwork) {
        const artHash = await computeHash(meta.artwork);
        artworkBlobId = `art:${artHash}`;
        const exists = await db.blobs.get(artworkBlobId);
        if (!exists) {
          const artBlob: BlobDoc = {
            id: artworkBlobId,
            type: 'artwork',
            blob: meta.artwork,
            createdAt: Date.now(),
          };
          await db.blobs.put(artBlob);
        }
      }

      const id: ID = crypto.randomUUID();
      const track: Track = {
        id,
        title: meta.title || file.name.replace(/\.[^.]+$/, ''),
        artist: meta.artist || 'Unknown Artist',
        album: meta.album || 'Unknown Album',
        duration: Math.round(meta.duration || 0),
        year: meta.year,
        genre: meta.genre,
        artworkBlobId,
        audioBlobId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.tracks.put(track);
      imported++;
    } catch (_err) {
      console.warn('Import failed for', file.name, _err);
      errors++;
    } finally {
      done++;
      onProgress?.(done, files.length);
    }
  }
  return { imported, skipped, errors };
}

export async function createPlaylist(name: string): Promise<ID> {
  const id = crypto.randomUUID();
  const playlist: Playlist = { id, name, trackIds: [], createdAt: Date.now(), updatedAt: Date.now() };
  await db.playlists.put(playlist);
  return id;
}

export async function renamePlaylist(id: ID, name: string) {
  await db.playlists.update(id, { name, updatedAt: Date.now() });
}

export async function deletePlaylist(id: ID) {
  await db.playlists.delete(id);
}

export async function addTracksToPlaylist(id: ID, trackIds: ID[]) {
  const pl = await db.playlists.get(id);
  if (!pl) return;
  const set = new Set(pl.trackIds);
  for (const tid of trackIds) set.add(tid);
  await db.playlists.update(id, { trackIds: Array.from(set), updatedAt: Date.now() });
}

export async function removeTrackFromPlaylist(id: ID, trackId: ID) {
  const pl = await db.playlists.get(id);
  if (!pl) return;
  await db.playlists.update(id, {
    trackIds: pl.trackIds.filter((t) => t !== trackId),
    updatedAt: Date.now(),
  });
}

export async function reorderPlaylist(id: ID, from: number, to: number) {
  const pl = await db.playlists.get(id);
  if (!pl) return;
  const arr = pl.trackIds.slice();
  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  await db.playlists.update(id, { trackIds: arr, updatedAt: Date.now() });
}

export async function exportLibrary(): Promise<Blob> {
  const [tracks, playlists, settings] = await Promise.all([
    db.tracks.toArray(),
    db.playlists.toArray(),
    db.app.get('settings'),
  ]);
  const data = { version: 1, tracks, playlists, settings };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export async function importLibrary(json: any) {
  if (!json || typeof json !== 'object') return;
  const { tracks, playlists, settings } = json;
  if (Array.isArray(tracks)) {
    for (const t of tracks) {
      const exists = await db.tracks.get(t.id);
      if (!exists) await db.tracks.put(t);
    }
  }
  if (Array.isArray(playlists)) {
    for (const p of playlists) await db.playlists.put(p);
  }
  if (settings && settings.id === 'settings') await db.app.put(settings);
}

// Dev seed (visit with ?seed=1)
export async function seedDemoIfRequested() {
  const url = new URL(location.href);
  if (!import.meta.env.DEV || url.searchParams.get('seed') !== '1') return;
  if (await db.tracks.count()) return;

  function makeWav(seconds = 1, freq = 440): Blob {
    const sampleRate = 44100;
    const length = seconds * sampleRate;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    function writeStr(o: number, s: string) {
      for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
    }
    const amp = 16000;
    // RIFF header
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeStr(8, 'WAVE');
    // fmt
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // pcm chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits
    // data
    writeStr(36, 'data');
    view.setUint32(40, length * 2, true);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const s = Math.sin(2 * Math.PI * freq * t);
      view.setInt16(44 + i * 2, s * amp, true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  const demoTracks = [
    { title: 'Demo A', artist: 'Cascade', album: 'Samples', freq: 440 },
    { title: 'Demo B', artist: 'Cascade', album: 'Samples', freq: 554 },
    { title: 'Demo C', artist: 'Cascade', album: 'Samples', freq: 659 },
  ];

  for (const d of demoTracks) {
    const blob = makeWav(2, d.freq as number);
    const file = new File([blob], `${d.title}.wav`, { type: 'audio/wav' });
    const audioHash = await computeHash(file);
    const audioBlobId = `audio:${audioHash}`;
    await db.blobs.put({ id: audioBlobId, type: 'audio', blob: file, createdAt: Date.now() });
    const id = crypto.randomUUID();
    const track: Track = {
      id,
      title: d.title,
      artist: d.artist,
      album: d.album,
      duration: 2,
      audioBlobId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    } as Track;
    await db.tracks.put(track);
  }
}
