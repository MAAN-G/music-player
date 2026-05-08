import React from 'react';
import UploadDropzone from '../components/UploadDropzone';
import { importFiles, seedDemoIfRequested } from '../db/indexedDb';

export default function Upload() {
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = React.useState<string>('');

  React.useEffect(() => { seedDemoIfRequested(); }, []);

  async function handleFiles(files: File[]) {
    setResult('');
    setProgress({ done: 0, total: files.length });
    const res = await importFiles(files, (done, total) => setProgress({ done, total }));
    setResult(`Imported ${res.imported}, skipped ${res.skipped}, errors ${res.errors}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload</h1>
      <UploadDropzone onFiles={handleFiles} />
      {progress && (
        <div className="card p-4">
          <div className="mb-2 text-sm">Parsing and importing… ({progress.done}/{progress.total})</div>
          <div className="h-2 w-full rounded bg-[hsl(var(--muted))]">
            <div
              className="h-2 rounded bg-[hsl(var(--accent))] transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
      {result && <div className="text-sm opacity-80">{result}</div>}
      <div className="opacity-70 text-sm">Tip: You can also drop files anywhere on this page.</div>
    </div>
  );
}
