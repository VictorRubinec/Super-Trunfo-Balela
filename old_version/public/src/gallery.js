import { renderNavbar } from './components/Navbar.js';

async function initGallery() {
    renderNavbar();
    if (window.lucide) window.lucide.createIcons();

    const photoGrid = document.getElementById('photo-grid');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');
    const filterContainer = document.getElementById('gallery-filters');
    const folderNameDisplay = document.getElementById('current-folder-name');
    const viewToggles = document.querySelectorAll('.view-toggle-btn');
    const btnBack = document.getElementById('btn-back-albums');
    const authorName = document.getElementById('author-name');
    const authorImg = document.getElementById('author-img');

    let currentView = 'general'; // 'general' é o padrão agora
    let allFolders = [];

    // --- Lógica de Pastas (Álbuns) ---
    async function loadAlbums() {
        currentView = 'folders';
        filterContainer.classList.add('hidden');
        photoGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Organizando álbuns...</p></div>';

        try {
            const res = await fetch('/api/gallery/folders');
            allFolders = await res.json();
            
            photoGrid.innerHTML = '';
            allFolders.forEach(folder => {
                const previews = folder.previewIds || [];
                
                const album = document.createElement('div');
                album.className = 'album-card';
                
                // Monta o HTML com as fotos (p1 é a capa, p2-p6 são as minis)
                let photosHtml = '';
                for (let i = 0; i < 6; i++) {
                    const photoId = previews[i];
                    if (photoId) {
                        const url = `/api/gallery/image/${photoId}`;
                        photosHtml += `<img src="${url}" class="album-photo p${i + 1}" loading="lazy">`;
                    }
                }

                album.innerHTML = `
                    ${photosHtml}
                    <div class="album-title">${folder.name}</div>
                `;
                album.onclick = () => {
                    currentView = 'single-folder';
                    folderNameDisplay.textContent = folder.name;
                    loadPhotos(folder.id);
                };
                photoGrid.appendChild(album);
            });
        } catch (err) {
            photoGrid.innerHTML = '<p>Erro ao carregar álbuns.</p>';
        }
    }

    // --- Lógica de Fotos (Geral ou Pasta Única) ---
    async function loadPhotos(folderId = '') {
        if (!folderId) {
            currentView = 'general';
            filterContainer.classList.add('hidden');
        } else {
            filterContainer.classList.remove('hidden');
        }

        photoGrid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Buscando fotos...</p></div>';

        try {
            const url = folderId ? `/api/gallery?folderId=${folderId}` : '/api/gallery';
            const response = await fetch(url);
            const photos = await response.json();

            photoGrid.innerHTML = '';
            if (photos.length === 0) {
                photoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhuma foto encontrada.</p>';
                return;
            }

            photos.forEach(photo => {
                const proxyUrl = `/api/gallery/image/${photo.id}`;
                const card = document.createElement('div');
                card.className = 'photo-card skeleton';
                card.innerHTML = `
                    <img src="${proxyUrl}" alt="${photo.name}" loading="lazy" style="opacity: 0; transition: opacity 0.5s ease;">
                    <div class="photo-info"><p class="photo-name">${photo.name}</p></div>
                `;
                const img = card.querySelector('img');
                img.onload = () => { card.classList.remove('skeleton'); img.style.opacity = '1'; };
                card.onclick = () => {
                    lightboxImg.src = proxyUrl;
                    authorName.textContent = photo.author;
                    authorImg.src = photo.authorPhoto || '';
                    authorImg.style.display = photo.authorPhoto ? 'block' : 'none';
                    lightbox.classList.add('active');
                };
                photoGrid.appendChild(card);
            });
        } catch (err) {
            photoGrid.innerHTML = '<p>Erro ao carregar fotos.</p>';
        }
    }

    // --- Eventos ---
    viewToggles.forEach(btn => {
        btn.onclick = () => {
            viewToggles.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (btn.dataset.view === 'folders') loadAlbums();
            else loadPhotos('');
        };
    });

    btnBack.onclick = () => {
        viewToggles.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-view="folders"]').classList.add('active');
        loadAlbums();
    };

    lightboxClose.onclick = () => { lightbox.classList.remove('active'); };
    lightbox.onclick = (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); };

    // Start
    loadPhotos(''); // Carrega o modo Geral primeiro
    loadFilters(); // Carrega os dados dos álbuns em background
}

document.addEventListener('DOMContentLoaded', initGallery);
