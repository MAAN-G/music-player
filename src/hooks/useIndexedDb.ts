import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/indexedDb';
import { ID, Playlist, Track } from '../types';

export function useAllTracks() {
  return useLiveQuery<Track[]>(() => db.tracks.orderBy('createdAt').reverse().toArray(), [], []);
}

export function useTrackById(id?: ID) {
  return useLiveQuery<Track | undefined>(() => (id ? db.tracks.get(id) : undefined), [id]);
}

export function usePlaylists() {
  return useLiveQuery<Playlist[]>(() => db.playlists.orderBy('createdAt').toArray(), [], []);
}

export function usePlaylist(id?: ID) {
  return useLiveQuery<Playlist | undefined>(() => (id ? db.playlists.get(id) : undefined), [id]);
}
