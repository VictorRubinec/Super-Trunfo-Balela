import { google } from 'googleapis';
import { GalleryAlbum, GalleryAlbumsResult, GalleryListResult, GalleryPhoto } from '@/core/domain/Gallery';

interface ListOptions {
  pageToken?: string;
  pageSize?: number;
  folderId?: string;
  excludeCover?: boolean;
}

type CacheEntry<T> = {
  expiresAt: number;
  result: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const COVER_REGEX = /^capa\./i;

const MOCK_PHOTOS: GalleryPhoto[] = [
  {
    id: 'mock-1',
    name: 'Bastidores 01',
    url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString(),
    mimeType: 'image/jpeg',
    approved: true,
    folderId: 'mock-folder-1',
    folderName: 'Gravacao Circo',
  },
  {
    id: 'mock-2',
    name: 'Bastidores 02',
    url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1400&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80',
    createdAt: new Date().toISOString(),
    mimeType: 'image/jpeg',
    approved: true,
    folderId: 'mock-folder-2',
    folderName: 'Banda de Rock',
  },
];

const MOCK_ALBUMS: GalleryAlbum[] = [
  {
    id: 'mock-folder-1',
    name: 'Gravacao Circo',
    coverUrl: MOCK_PHOTOS[0].thumbnailUrl,
    previewUrls: [MOCK_PHOTOS[0].thumbnailUrl],
    photoCount: 1,
  },
  {
    id: 'mock-folder-2',
    name: 'Banda de Rock',
    coverUrl: MOCK_PHOTOS[1].thumbnailUrl,
    previewUrls: [MOCK_PHOTOS[1].thumbnailUrl],
    photoCount: 1,
  },
];

export class GoogleDriveService {
  private isAuthError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error || '');
    return message.toLowerCase().includes('invalid_grant') || message.toLowerCase().includes('invalid credentials');
  }

  private getDriveClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return null;
    }

    const auth = new google.auth.OAuth2(clientId, clientSecret, 'https://developers.google.com/oauthplayground');
    auth.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth });
  }

  private getCached<T>(key: string): T | null {
    const entry = cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
      cache.delete(key);
      return null;
    }
    return entry.result;
  }

  private setCached<T>(key: string, result: T, ttlMs: number) {
    cache.set(key, { expiresAt: Date.now() + ttlMs, result });
  }

  async listFolders(): Promise<GalleryAlbumsResult> {
    const cacheKey = 'gallery:albums';
    const cached = this.getCached<GalleryAlbumsResult>(cacheKey);
    if (cached) return cached;

    const folderId = process.env.DRIVE_FOLDER_ID;
    const drive = this.getDriveClient();

    if (!drive || !folderId) {
      const mockResult: GalleryAlbumsResult = { albums: MOCK_ALBUMS, source: 'mock' };
      this.setCached(cacheKey, mockResult, 60_000);
      return mockResult;
    }

    try {
      const foldersResponse = await drive.files.list({
        q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        orderBy: 'name',
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageSize: 200,
      });

      const folders = foldersResponse.data.files || [];

      const albums = await Promise.all(
        folders.map(async (folder) => {
          const photoRes = await drive.files.list({
            q: `'${folder.id}' in parents and mimeType contains 'image/' and trashed = false`,
            fields: 'files(id, name, thumbnailLink, webViewLink)',
            orderBy: 'createdTime desc',
            pageSize: 12,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
          });

          const files = photoRes.data.files || [];
          const cover = files.find((f) => COVER_REGEX.test(f.name || ''));
          const nonCover = files.filter((f) => !COVER_REGEX.test(f.name || ''));
          const previews = nonCover.slice(0, 5);
          const coverFile = cover || previews[0];

          return {
            id: folder.id || '',
            name: folder.name || 'Sem nome',
            coverUrl: coverFile?.thumbnailLink || coverFile?.webViewLink || '',
            previewUrls: previews.map((f) => f.thumbnailLink || f.webViewLink || '').filter(Boolean),
            photoCount: nonCover.length,
          } as GalleryAlbum;
        })
      );

      const result: GalleryAlbumsResult = { albums: albums.filter((a) => a.id), source: 'google-drive' };
      this.setCached(cacheKey, result, 60_000);
      return result;
    } catch (error) {
      if (this.isAuthError(error)) {
        const mockResult: GalleryAlbumsResult = { albums: MOCK_ALBUMS, source: 'mock' };
        this.setCached(cacheKey, mockResult, 30_000);
        return mockResult;
      }
      throw error;
    }
  }

  async listImages(options: ListOptions = {}): Promise<GalleryListResult> {
    const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 100);
    const pageToken = options.pageToken ?? '';
    const folderIdOption = options.folderId ?? '';
    const excludeCover = options.excludeCover ?? true;
    const cacheKey = `gallery:images:${pageToken}:${pageSize}:${folderIdOption}:${excludeCover ? '1' : '0'}`;
    const cached = this.getCached<GalleryListResult>(cacheKey);
    if (cached) return cached;

    const rootFolderId = process.env.DRIVE_FOLDER_ID;
    const drive = this.getDriveClient();

    if (!drive || !rootFolderId) {
      const photos = excludeCover ? MOCK_PHOTOS.filter((p) => !COVER_REGEX.test(p.name)) : MOCK_PHOTOS;
      const result: GalleryListResult = {
        photos: photos.slice(0, pageSize),
        nextPageToken: null,
        source: 'mock',
      };
      this.setCached(cacheKey, result, 60_000);
      return result;
    }

    const folderIds: string[] = [];
    if (folderIdOption) {
      folderIds.push(folderIdOption);
    } else {
      const folders = await this.listFolders();
      folderIds.push(rootFolderId, ...folders.albums.map((a) => a.id));
    }

    const parentQuery = folderIds.map((id) => `'${id}' in parents`).join(' or ');
    const query = `(${parentQuery}) and mimeType contains 'image/' and trashed = false`;

    try {
      const response = await drive.files.list({
        q: query,
        fields: 'nextPageToken, files(id, name, createdTime, mimeType, thumbnailLink, webViewLink, parents)',
        orderBy: 'createdTime desc',
        pageSize,
        pageToken: pageToken || undefined,
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
      });

      const folderMap = new Map<string, string>();
      if (!folderIdOption) {
        const folders = await this.listFolders();
        folders.albums.forEach((f) => folderMap.set(f.id, f.name));
      }

      const allFiles = response.data.files || [];
      const filtered = excludeCover ? allFiles.filter((f) => !COVER_REGEX.test(f.name || '')) : allFiles;

      const photos: GalleryPhoto[] = filtered.map((file) => {
        const parentId = file.parents?.[0] || '';
        return {
          id: file.id || '',
          name: file.name || 'Sem nome',
          url: `/api/gallery/image/${file.id}`,
          thumbnailUrl: file.thumbnailLink || file.webViewLink || `/api/gallery/image/${file.id}`,
          createdAt: file.createdTime || new Date().toISOString(),
          mimeType: file.mimeType || 'image/jpeg',
          approved: true,
          folderId: parentId,
          folderName: folderMap.get(parentId),
        };
      }).filter((photo) => Boolean(photo.id));

      const result: GalleryListResult = {
        photos,
        nextPageToken: response.data.nextPageToken || null,
        source: 'google-drive',
      };

      this.setCached(cacheKey, result, 45_000);
      return result;
    } catch (error) {
      if (this.isAuthError(error)) {
        const photos = excludeCover ? MOCK_PHOTOS.filter((p) => !COVER_REGEX.test(p.name)) : MOCK_PHOTOS;
        const result: GalleryListResult = {
          photos: photos.slice(0, pageSize),
          nextPageToken: null,
          source: 'mock',
        };
        this.setCached(cacheKey, result, 30_000);
        return result;
      }
      throw error;
    }
  }

  async getFileBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const drive = this.getDriveClient();
    if (!drive) return null;

    const metadata = await drive.files.get({ fileId, fields: 'mimeType' });
    const media = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });

    const mimeType = metadata.data.mimeType || 'application/octet-stream';
    const buffer = Buffer.from(media.data as ArrayBuffer);
    return { buffer, mimeType };
  }
}
