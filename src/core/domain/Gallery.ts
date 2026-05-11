export interface GalleryPhoto {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
  mimeType: string;
  approved: boolean;
  folderId?: string;
  folderName?: string;
}

export interface GalleryListResult {
  photos: GalleryPhoto[];
  nextPageToken: string | null;
  source: 'google-drive' | 'mock';
}

export interface GalleryAlbum {
  id: string;
  name: string;
  coverUrl: string;
  previewUrls: string[];
  photoCount: number;
}

export interface GalleryAlbumsResult {
  albums: GalleryAlbum[];
  source: 'google-drive' | 'mock';
}
