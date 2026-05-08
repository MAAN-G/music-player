import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db, getOrInitSettings, saveSettings } from '../db/indexedDb';
import { ID, RepeatMode, Track } from '../types';
import { formatTime } from '../lib/audio';

interface PlayerContextValue {
  currentId?: ID;
  current?: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  queue: ID[];
  index: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isQueueOpen: boolean;
  // controls
  playTrack: (id: ID, queue?: ID[]) => Promise<void>;
  playQueue: (ids: ID[], index?: number) => Promise<void>;
  toggle: () => void;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  enqueue: (ids: ID[]) => void;
  playNext: (id: ID) => void;
  removeAt: (i: number) => void;
  clearQueue: () => void;
  reorderQueue: (from: number, to: number) => void;
  setShuffle: (v: boolean) => void;
  setRepeat: (m: RepeatMode) => void;
  setQueueOpen: (v: boolean) => void;
  timeLabel: string;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentId, setCurrentId] = useState<ID | undefined>(undefined);
  const [current, setCurrent] = useState<Track | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<ID[]>([]);
  const [index, setIndex] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [isQueueOpen, setQueueOpen] = useState(false);
  const timeLabel = useMemo(() => `${formatTime(currentTime)} / ${formatTime(duration)}`, [currentTime, duration]);

  useEffect(() => {
    (async () => {
      const s = await getOrInitSettings();
      setShuffle(s.shuffle);
      setRepeat(s.repeat);
      if (s.lastQueue?.length) {
        setQueue(s.lastQueue);
        setIndex(Math.min(s.lastIndex ?? 0, s.lastQueue.length - 1));
        setCurrentId(s.lastQueue[s.lastIndex] || s.lastQueue[0]);
        setCurrentTime(s.lastPosition || 0);
      }
      // theme
      const root = document.documentElement;
      if (s.theme === 'dark' || (s.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    })();
  }, []);

  // Load track blob URL when currentId changes
  useEffect(() => {
    let revoked = false;
    (async () => {
      if (!currentId) return;
      const t = await db.tracks.get(currentId);
      setCurrent(t);
      if (!t) return;
      const blob = await db.blobs.get(t.audioBlobId);
      if (!blob) return;
      const url = URL.createObjectURL(blob.blob);
      const audio = audioRef.current!;
      audio.src = url;
      // Use currentTime state so explicit selection (which sets 0 beforehand) starts at 0,
      // while initial session restore can resume from lastPosition > 0.
      audio.currentTime = currentTime || 0;
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      // Media Session
      if ('mediaSession' in navigator) {
        const artBlob = t.artworkBlobId ? await db.blobs.get(t.artworkBlobId) : undefined;
        const artwork = artBlob
          ? [{ src: URL.createObjectURL(artBlob.blob), sizes: '512x512', type: artBlob.blob.type }]
          : [];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: t.title,
          artist: t.artist,
          album: t.album,
          artwork,
        });
        navigator.mediaSession.setActionHandler('play', () => play());
        navigator.mediaSession.setActionHandler('pause', () => pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => next());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (typeof details.seekTime === 'number') seek(details.seekTime);
        });
      }
      return () => {
        if (!revoked) URL.revokeObjectURL(url);
      };
    })();
    return () => {
      revoked = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId]);

  // Persist session
  useEffect(() => {
    saveSettings({ lastQueue: queue, lastIndex: index, lastPosition: currentTime });
  }, [queue, index, currentTime]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current!;
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        audio.play();
        return;
      }
      next();
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, queue, index]);

  async function playTrack(id: ID, newQueue?: ID[]) {
    if (newQueue) {
      setQueue(newQueue);
      const i = newQueue.indexOf(id);
      setIndex(i >= 0 ? i : 0);
    } else if (!queue.length) {
      setQueue([id]);
      setIndex(0);
    } else {
      setIndex(queue.indexOf(id));
    }
    setCurrentTime(0);
    setCurrentId(id);
  }

  async function playQueue(ids: ID[], i = 0) {
    setQueue(ids);
    setIndex(Math.max(0, Math.min(i, ids.length - 1)));
    setCurrentTime(0);
    setCurrentId(ids[i]);
  }

  function play() {
    const a = audioRef.current!;
    a.play();
    setIsPlaying(true);
  }
  function pause() {
    const a = audioRef.current!;
    a.pause();
    setIsPlaying(false);
  }
  function toggle() {
    isPlaying ? pause() : play();
  }

  function next() {
    if (!queue.length) return;
    let nextIndex = index + 1;
    if (shuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === index);
    }
    if (nextIndex >= queue.length) {
      if (repeat === 'all') nextIndex = 0;
      else {
        pause();
        return;
      }
    }
    setIndex(nextIndex);
    setCurrentTime(0);
    setCurrentId(queue[nextIndex]);
  }

  function prev() {
    if (!queue.length) return;
    let prevIndex = index - 1;
    if (prevIndex < 0) prevIndex = repeat === 'all' ? queue.length - 1 : 0;
    setIndex(prevIndex);
    setCurrentTime(0);
    setCurrentId(queue[prevIndex]);
  }

  function seek(seconds: number) {
    const a = audioRef.current!;
    a.currentTime = Math.max(0, Math.min(seconds, a.duration || 0));
    setCurrentTime(a.currentTime);
  }

  function enqueue(ids: ID[]) {
    if (!ids.length) return;
    setQueue((q) => q.concat(ids));
  }

  function playNext(id: ID) {
    setQueue((q) => {
      const arr = q.slice();
      arr.splice(index + 1, 0, id);
      return arr;
    });
  }

  function removeAt(i: number) {
    setQueue((q) => q.filter((_, idx) => idx !== i));
    if (i < index) setIndex((v) => v - 1);
    if (i === index) next();
  }

  function clearQueue() {
    pause();
    setQueue([]);
    setIndex(0);
    setCurrentId(undefined);
    setCurrent(undefined);
  }

  function reorderQueue(from: number, to: number) {
    setQueue((q) => {
      const arr = q.slice();
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
    if (from === index) setIndex(to);
  }

  useEffect(() => {
    saveSettings({ shuffle, repeat });
  }, [shuffle, repeat]);

  const value: PlayerContextValue = {
    currentId,
    current,
    isPlaying,
    currentTime,
    duration,
    queue,
    index,
    shuffle,
    repeat,
    isQueueOpen,
    playTrack,
    playQueue,
    toggle,
    play,
    pause,
    next,
    prev,
    seek,
    enqueue,
    playNext,
    removeAt,
    clearQueue,
    reorderQueue,
    setShuffle,
    setRepeat,
    setQueueOpen,
    timeLabel,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" hidden />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
