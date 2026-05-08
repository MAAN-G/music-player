import { parseBlob } from 'music-metadata-browser';

export interface ParsedMeta {
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  year?: number;
  genre?: string;
  artwork?: Blob;
}

export async function parseAudioFile(file: Blob): Promise<ParsedMeta> {
  try {
    const metadata = await parseBlob(file);
    const common = metadata.common || {};
    const format = metadata.format || {};
    const picture = Array.isArray(common.picture) && common.picture.length ? common.picture[0] : undefined;
    let artwork: Blob | undefined;
    if (picture && picture.data) {
      const mime = picture.format || 'image/jpeg';
      artwork = new Blob([picture.data], { type: mime });
    }
    return {
      title: common.title,
      artist: (common.artist || (Array.isArray(common.artists) ? common.artists.join(', ') : undefined)) as string | undefined,
      album: common.album,
      duration: typeof format.duration === 'number' ? format.duration : undefined,
      year: typeof common.year === 'number' ? common.year : undefined,
      genre: Array.isArray(common.genre) ? common.genre[0] : common.genre,
      artwork,
    };
  } catch (_err) {
    // Best-effort fallback
    return {};
  }
}
