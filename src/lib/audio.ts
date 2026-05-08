export async function computeHash(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export function gradientPlaceholderDataUrl(seed: string, title = 'Track', artist = ''): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const c1 = `hsl(${h % 360} 70% 55%)`;
  const c2 = `hsl(${(h + 60) % 360} 70% 45%)`;
  const initials = (title[0] || 'M') + (artist[0] || '');
  const svg = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512'>
      <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${c1}'/><stop offset='100%' stop-color='${c2}'/></linearGradient></defs>
      <rect width='512' height='512' rx='24' fill='url(#g)'/>
      <text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif' font-size='160' fill='rgba(255,255,255,.92)' font-weight='700'>${initials}</text>
    </svg>`
  );
  return `data:image/svg+xml;charset=utf-8,${svg}`;
}
