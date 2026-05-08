export type ID = string;

export interface Track {
  id: ID;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  year?: number;
  genre?: string;
  artworkBlobId?: ID;
  audioBlobId: ID;
  createdAt: number;
  updatedAt: number;
}

export type BlobType = 'audio' | 'artwork';

export interface BlobDoc {
  id: ID;
  type: BlobType;
  blob: Blob;
  createdAt: number;
}

export interface Playlist {
  id: ID;
  name: string;
  trackIds: ID[];
  createdAt: number;
  updatedAt: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface AppSettings {
  id: 'settings';
  theme: 'system' | 'light' | 'dark';
  shuffle: boolean;
  repeat: RepeatMode;
  lastQueue: ID[];
  lastIndex: number;
  lastPosition: number;
  lastTrackId?: ID;
}

export interface QueueState {
  ids: ID[];
  index: number;
}
