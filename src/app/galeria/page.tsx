'use client';

import { useEffect, useState } from 'react';
import './galeria.css';
import { GalleryAlbum, GalleryPhoto } from '@/core/domain/Gallery';

type GalleryView = 'all' | 'albums';

export default function GaleriaPage() {
  const [view, setView] = useState<GalleryView>('all');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<GalleryAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState('');
  const [lightboxTitle, setLightboxTitle] = useState('');

  const loadAlbums = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/gallery?view=albums', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar álbuns');
      setAlbums(Array.isArray(data.albums) ? data.albums : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadPhotos = async (folderId?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = folderId
        ? `/api/gallery?view=all&folderId=${encodeURIComponent(folderId)}&pageSize=120`
        : '/api/gallery?view=all&pageSize=120';
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao carregar fotos');
      setPhotos(Array.isArray(data.photos) ? data.photos : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPhotos();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const openAlbum = async (album: GalleryAlbum) => {
    setSelectedAlbum(album);
    setView('all');
    await loadPhotos(album.id);
  };

  const backToAlbums = async () => {
    setSelectedAlbum(null);
    setView('albums');
    await loadAlbums();
  };

  const switchToAll = async () => {
    setSelectedAlbum(null);
    setView('all');
    await loadPhotos();
  };

  const switchToAlbums = async () => {
    setSelectedAlbum(null);
    setView('albums');
    await loadAlbums();
  };

  return (
    <main className="gallery-page container">
      <header className="gallery-top">
        <h1 className="gallery-main-title">Galeria dos Membros</h1>
        <p className="gallery-main-subtitle">Explore fotos, momentos, registros das gravações feitos pelos membros que foram nelas.</p>
      </header>

      <div className="gallery-view-toggle">
        <button className={`view-toggle-btn ${view === 'all' && !selectedAlbum ? 'active' : ''}`} onClick={() => void switchToAll()}>
          Todas as fotos
        </button>
        <button className={`view-toggle-btn ${view === 'albums' ? 'active' : ''}`} onClick={() => void switchToAlbums()}>
          Álbuns
        </button>
      </div>

      {selectedAlbum && (
        <div className="album-toolbar">
          <button className="back-albums-btn" onClick={() => void backToAlbums()}>Voltar para álbuns</button>
          <span className="album-current">{selectedAlbum.name}</span>
        </div>
      )}
      {error && <p className="gallery-error">{error}</p>}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /><p>Carregando galeria...</p></div>
      ) : view === 'albums' ? (
        <section className="albums-grid">
          {albums.map((album) => (
            <article key={album.id} className="album-card" onClick={() => void openAlbum(album)}>
              <div className="album-stack">
                {(album.previewUrls.length ? album.previewUrls : [album.coverUrl]).slice(0, 6).map((url, idx) => (
                  <img key={`${album.id}-${idx}`} src={url} className={`album-photo p${idx + 1}`} alt={`${album.name} ${idx + 1}`} loading="lazy" />
                ))}
              </div>
              <div className="album-title-wrap">
                <h3>{album.name}</h3>
                <span>{album.photoCount} fotos</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="photo-grid">
          {photos.map((photo) => (
            <article
              key={photo.id}
              className="photo-card"
              onClick={() => {
                setLightboxUrl(photo.url);
                setLightboxTitle(photo.name);
              }}
            >
              <img src={photo.url} alt={photo.name} loading="lazy" />
              <div className="photo-info">
                {photo.folderName && <p className="photo-folder">{photo.folderName}</p>}
              </div>
            </article>
          ))}
        </section>
      )}

      {lightboxUrl && (
        <div className="gallery-lightbox active" onClick={() => setLightboxUrl('')}>
          <button className="lightbox-close" onClick={() => setLightboxUrl('')} aria-label="Fechar">×</button>
          <img src={lightboxUrl} alt={lightboxTitle} onClick={(e) => e.stopPropagation()} />
          <p className="lightbox-title">{lightboxTitle}</p>
        </div>
      )}
    </main>
  );
}
