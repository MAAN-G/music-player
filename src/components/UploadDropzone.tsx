import React from 'react';

export default function UploadDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('audio/'));
    if (files.length) onFiles(files);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={`card flex cursor-pointer flex-col items-center justify-center gap-2 p-8 text-center ${dragOver ? 'ring-2 ring-accent' : ''}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="Upload audio files"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <div className="text-4xl">⬆️🎵</div>
      <div className="text-lg font-medium">Drag and drop MP3s here</div>
      <div className="opacity-70">or click to choose files</div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          if (files.length) onFiles(files);
        }}
      />
    </div>
  );
}
