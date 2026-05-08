import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { saveSettings, getOrInitSettings } from '../db/indexedDb';

export default function TopBar() {
  const [theme, setTheme] = React.useState<'system' | 'light' | 'dark'>('system');
  React.useEffect(() => {
    (async () => {
      const s = await getOrInitSettings();
      setTheme(s.theme);
    })();
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveSettings({ theme });
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b border-[hsl(var(--muted))] bg-white/60 dark:bg-neutral-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/songs" className="flex items-center gap-2 font-semibold">
          <img src="/icons/app-icon.svg" alt="Logo" className="h-6 w-6" />
          <span>Local Music</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <NavLink to="/upload" className={({ isActive }) => `btn-ghost ${isActive ? 'underline' : ''}`}>
            Upload
          </NavLink>
          <NavLink to="/songs" className={({ isActive }) => `btn-ghost ${isActive ? 'underline' : ''}`}>
            All Songs
          </NavLink>
          <NavLink to="/playlists" className={({ isActive }) => `btn-ghost ${isActive ? 'underline' : ''}`}>
            Playlists
          </NavLink>
          <NavLink to="/now-playing" className={({ isActive }) => `btn-ghost ${isActive ? 'underline' : ''}`}>
            Now Playing
          </NavLink>
          <div className="ml-2">
            <label className="sr-only" htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="input text-sm py-1"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </nav>
      </div>
    </header>
  );
}
