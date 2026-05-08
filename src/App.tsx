import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Upload from './pages/Upload';
import Songs from './pages/Songs';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import NowPlaying from './pages/NowPlaying';
import PlayerBar from './components/PlayerBar';
import TopBar from './components/TopBar';
import QueueDrawer from './components/QueueDrawer';
import { usePlayer } from './hooks/usePlayer';

function Layout() {
  const { isQueueOpen } = usePlayer();
  return (
    <div className="flex min-h-full flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-4">
        <Routes>
          <Route path="/" element={<Navigate to="/songs" replace />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/songs" element={<Songs />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/playlists/:id" element={<PlaylistDetail />} />
          <Route path="/now-playing" element={<NowPlaying />} />
          <Route path="*" element={<Navigate to="/songs" replace />} />
        </Routes>
      </main>
      <PlayerBar />
      {isQueueOpen && <QueueDrawer />}
    </div>
  );
}

export default function App() {
  return <Layout />;
}
