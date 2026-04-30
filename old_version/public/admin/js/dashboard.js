import ApiClient from '../../src/utils/api-client.js';
import AuthManager from '../../src/components/auth-manager.js';
import Toast from '../../src/utils/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar Autenticação (Admin Only)
    await AuthManager.init();
    const profile = await AuthManager.waitReady();
    
    if (!profile || profile.role !== 'admin') {
        Toast.error('Acesso negado. Apenas administradores.');
        setTimeout(() => window.location.href = '/error', 2000);
        return;
    }

    document.querySelector('.admin-wrapper').classList.add('authorized');
    document.getElementById('admin-email').textContent = profile.email;

    // 2. Navegação entre seções
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    const sections = document.querySelectorAll('.admin-section');

    navItems.forEach(item => {
        item.onclick = () => {
            const sectionId = item.getAttribute('data-section');
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            sections.forEach(s => s.classList.remove('active'));
            document.getElementById(sectionId).classList.add('active');

            document.getElementById('section-title').textContent = item.textContent.trim();
            
            // Recarregar dados se necessário
            if (sectionId === 'users') loadUsers();
            if (sectionId === 'audit') loadAudit();
            if (sectionId === 'metrics') loadMetrics();
            if (sectionId === 'gallery') loadGallery();
        };
    });

    // 3. Lógica de Métricas (Dashboard)
    let trafficChart = null;
    let storageChart = null;

    async function loadMetrics() {
        try {
            const data = await ApiClient.getDashboardData();
            
            // Atualizar Cards
            const totalVisits = Object.values(data.traffic).reduce((a, b) => a + b, 0);
            document.getElementById('total-traffic').textContent = totalVisits;
            
            const supabaseMB = (data.storage.supabase.used / (1024 * 1024)).toFixed(2);
            document.getElementById('supabase-storage').textContent = `${supabaseMB}MB`;

            const driveGB = (data.storage.drive.used / (1024 * 1024 * 1024)).toFixed(2);
            document.getElementById('drive-storage').textContent = `${driveGB}GB`;

            // Renderizar Gráficos
            renderTrafficChart(data.traffic);
            renderStorageChart(data.storage);
        } catch (err) {
            Toast.error('Erro ao carregar métricas');
        }
    }

    function renderTrafficChart(trafficData) {
        const ctx = document.getElementById('trafficChart').getContext('2d');
        if (trafficChart) trafficChart.destroy();

        trafficChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(trafficData),
                datasets: [{
                    data: Object.values(trafficData),
                    backgroundColor: ['#7b2fbe', '#00d2ff', '#ff4d4d', '#ffcc00', '#00ff88'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#fff' } }
                }
            }
        });
    }

    function renderStorageChart(storage) {
        const ctx = document.getElementById('storageChart').getContext('2d');
        if (storageChart) storageChart.destroy();

        const driveUsed = (storage.drive.used / (1024**3)).toFixed(2);
        const driveTotal = (storage.drive.total / (1024**3)).toFixed(2);

        storageChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Google Drive', 'Supabase'],
                datasets: [
                    {
                        label: 'Usado (GB/MB)',
                        data: [driveUsed, (storage.supabase.used / 1024**2).toFixed(2)],
                        backgroundColor: '#7b2fbe'
                    },
                    {
                        label: 'Total',
                        data: [driveTotal, (storage.supabase.total / 1024**2).toFixed(2)],
                        backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#888' } },
                    x: { ticks: { color: '#fff' } }
                }
            }
        });
    }

    // 4. Lógica de Gestão de Usuários
    window.allUsers = [];

    async function loadUsers() {
        const body = document.getElementById('users-table-body');
        if (!body) return;
        body.innerHTML = '<tr><td colspan="5">Carregando usuários...</td></tr>';

        try {
            const token = AuthManager.getToken();
            const res = await fetch('/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const users = await res.json();
            window.allUsers = users;
            renderUsersTable(users);
        } catch (err) {
            Toast.error('Erro ao carregar usuários');
        }
    }

    function renderUsersTable(users) {
        const body = document.getElementById('users-table-body');
        if (!body) return;

        body.innerHTML = users.map(user => `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px">
                        <img src="${user.avatar_url || '/assets/avatars/default-avatar.png'}" style="width: 30px; height: 30px; border-radius: 50%; object-fit: cover">
                        <span>${user.display_name || 'Sem nome'}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>
                    <select onchange="updateUserRole('${user.id}', this.value)" class="glass-select">
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="member" ${user.role === 'member' ? 'selected' : ''}>Membro</option>
                        <option value="visitor" ${user.role === 'visitor' ? 'selected' : ''}>Visitante</option>
                    </select>
                </td>
                <td style="font-size: 0.8rem; color: #888">${user.created_at || user.updated_at ? new Date(user.created_at || user.updated_at).toLocaleDateString() : '---'}</td>
                <td>
                    <button class="btn-icon btn-danger" onclick="deleteUser('${user.id}')" title="Remover da Equipe">
                        <i data-lucide="user-minus"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
    }

    window.updateUserRole = async (id, newRole) => {
        try {
            const token = AuthManager.getToken();
            const res = await fetch(`/api/admin/users/${id}/role`, {
                method: 'PATCH',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) throw new Error('Erro ao atualizar cargo');
            Toast.success('Cargo atualizado!');
            loadUsers();
        } catch (err) {
            Toast.error(err.message);
        }
    };

    window.deleteUser = async (id) => {
        if (!confirm('Deseja realmente remover este usuário da equipe?')) return;
        try {
            const token = AuthManager.getToken();
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Erro ao remover usuário');
            Toast.success('Usuário removido!');
            loadUsers();
        } catch (err) {
            Toast.error(err.message);
        }
    };

    // Convidar Usuário
    const btnNewUser = document.getElementById('btn-new-user');
    if (btnNewUser) {
        btnNewUser.onclick = async () => {
            const email = prompt('Digite o e-mail do novo membro da equipe:');
            if (!email) return;

            try {
                const token = AuthManager.getToken();
                const res = await fetch('/api/admin/users/invite', {
                    method: 'POST',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                if (!res.ok) {
                    const error = await res.json();
                    throw new Error(error.error || 'Erro ao enviar convite');
                }

                Toast.success('Convite enviado com sucesso para o e-mail!');
                loadUsers();
            } catch (err) {
                Toast.error(err.message);
            }
        };
    }

    // Filtro de Busca
    const userSearch = document.getElementById('user-search-filter');
    if (userSearch) {
        userSearch.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = window.allUsers.filter(u => 
                u.email.toLowerCase().includes(term) || 
                (u.display_name && u.display_name.toLowerCase().includes(term))
            );
            renderUsersTable(filtered);
        };
    }

    // 5. Lógica de Auditoria
    async function loadAudit() {
        const body = document.getElementById('audit-table-body');
        if (!body) return;
        body.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';

        try {
            const logs = await ApiClient.getAuditLogs();
            window.lastAuditLogs = logs; // Guardar para o modal
            
            body.innerHTML = logs.map((log, index) => {
                // Formatar descrição amigavelmente
                let detailsStr = '';
                const rawDetails = log.description;
                
                if (rawDetails) {
                    if (typeof rawDetails === 'string') {
                        detailsStr = rawDetails;
                    } else {
                        detailsStr = Object.entries(rawDetails)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ');
                    }
                }

                return `
                    <tr onclick="showAuditDetail(${index})">
                        <td style="font-size: 0.8rem">${new Date(log.created_at).toLocaleString()}</td>
                        <td>${log.profiles?.email || 'Sistema'}</td>
                        <td><span class="badge ${getActionClass(log.action)}">${log.action}</span></td>
                        <td style="font-size: 0.8rem; color: #aaa">${detailsStr || '-'}</td>
                    </tr>
                `;
            }).join('');
        } catch (err) {
            body.innerHTML = '<tr><td colspan="4">Erro ao carregar logs.</td></tr>';
        }
    }

    function getActionClass(action) {
        if (action.includes('CREATE')) return 'badge-success';
        if (action.includes('DELETE')) return 'badge-danger';
        if (action.includes('UPDATE') || action.includes('RENAME')) return 'badge-warning';
        return 'badge-info';
    }

    window.showAuditDetail = (index) => {
        const log = window.lastAuditLogs[index];
        if (!log) return;

        document.getElementById('detail-date').textContent = new Date(log.created_at).toLocaleString();
        document.getElementById('detail-user').textContent = log.profiles?.email || 'Sistema';
        
        const actionBadge = document.getElementById('detail-action');
        actionBadge.textContent = log.action;
        actionBadge.className = `badge ${getActionClass(log.action)}`;
        
        document.getElementById('detail-json').value = JSON.stringify(log.description || {}, null, 4);
        
        document.getElementById('modal-audit-details').classList.add('active');
    };

    const btnCloseAudit = document.getElementById('btn-close-audit');
    if (btnCloseAudit) {
        btnCloseAudit.onclick = () => document.getElementById('modal-audit-details').classList.remove('active');
    }

    // 6. Lógica de Galeria
    const galleryFilter = document.getElementById('admin-gallery-filter');
    const imageGrid = document.getElementById('admin-gallery-images');
    const photoCount = document.getElementById('gallery-photo-count');

    if (galleryFilter) {
        galleryFilter.onchange = () => loadGalleryImages(galleryFilter.value);
    }

    async function loadGallery() {
        try {
            await loadUsers();
            await loadGalleryAlbums();
            
            const res = await fetch(`/api/gallery/folders?t=${Date.now()}`);
            const folders = await res.json();
            
            if (galleryFilter) {
                const currentValue = galleryFilter.value;
                galleryFilter.innerHTML = '<option value="">Todos os Álbuns</option>' + 
                    folders.map(f => `<option value="${f.id}" ${f.id === currentValue ? 'selected' : ''}>${f.name}</option>`).join('');
            }
            
            await loadGalleryImages(galleryFilter?.value || '');
            await loadAudit();
        } catch (err) {
            console.error('[Dashboard] Erro no recarregamento:', err);
        }
    }

    async function loadGalleryImages(folderId = '') {
        imageGrid.innerHTML = '<div class="loading-spinner">Carregando imagens...</div>';
        
        try {
            const url = `/api/gallery?t=${Date.now()}${folderId ? `&folderId=${folderId}` : ''}`;
            const res = await fetch(url);
            const photos = await res.json();
            
            photoCount.textContent = `${photos.length} fotos encontradas`;
            
            if (photos.length === 0) {
                imageGrid.innerHTML = '<div class="no-data">Nenhuma foto encontrada neste álbum.</div>';
                return;
            }

            imageGrid.innerHTML = photos.map(p => `
                <div class="admin-image-card glass">
                    <div class="img-wrapper">
                        <img src="${p.url}${p.url.includes('?') ? '&' : '?'}t=${Date.now()}" alt="${p.name}" loading="lazy">
                    </div>
                    <div class="img-info">
                        <span class="img-name">${p.name}</span>
                        <div class="img-actions">
                            <button class="btn-primary btn-sm" style="background: #ff4d4d" title="Excluir" onclick="deleteImage('${p.id}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            lucide.createIcons();
        } catch (err) {
            imageGrid.innerHTML = 'Erro ao carregar fotos.';
        }
    }

    async function loadGalleryAlbums() {
        const albumGrid = document.getElementById('admin-gallery-albums');
        albumGrid.innerHTML = ''; // Limpar antes de carregar
        
        try {
            const res = await fetch(`/api/gallery/folders?t=${Date.now()}`);
            const folders = await res.json();
            
            albumGrid.innerHTML = folders.map(f => `
                <div class="admin-folder-card glass" onclick="openAlbum('${f.id}')" data-folder-id="${f.id}">
                    <div class="album-stack">
                        ${f.previewIds.slice(0, 4).map((id, idx) => `
                            <img src="/api/gallery/image/${id}?t=${Date.now()}" class="stack-img" alt="Foto ${idx+1}">
                        `).join('')}
                        ${f.previewIds.length === 0 ? '<i data-lucide="image-off" style="opacity: 0.2; width: 48px; height: 48px;"></i>' : ''}
                    </div>
                    <div class="folder-info">
                        <div class="folder-text">
                            <h4>${f.name}</h4>
                            <span>${f.previewIds.length} fotos</span>
                        </div>
                        <div class="folder-actions" onclick="event.stopPropagation()">
                            <button class="btn-primary btn-sm btn-outline" title="Renomear" onclick="renameAlbum('${f.id}', '${f.name}')">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="btn-primary btn-sm" style="background: #ff4d4d" title="Excluir" onclick="deleteAlbum('${f.id}')">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
        } catch (err) {
            albumGrid.innerHTML = 'Erro ao carregar álbuns.';
        }
    }

    window.openAlbum = (id) => {
        const photoBtn = document.querySelector('.view-btn[data-view="photos"]');
        if (photoBtn) {
            photoBtn.click(); // Alterna para a visão de fotos
            if (galleryFilter) {
                galleryFilter.value = id; // Define o filtro
                loadGalleryImages(id); // Carrega as imagens
            }
        }
    };

    // Controle de Visão da Galeria
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.onclick = () => {
            const view = btn.getAttribute('data-view');
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (view === 'photos') {
                document.getElementById('gallery-controls-photos').classList.remove('hidden');
                document.getElementById('admin-gallery-images').classList.remove('hidden');
                document.getElementById('albums-section').classList.add('hidden');
                loadGalleryImages(galleryFilter?.value || '');
            } else {
                document.getElementById('gallery-controls-photos').classList.add('hidden');
                document.getElementById('admin-gallery-images').classList.add('hidden');
                document.getElementById('albums-section').classList.remove('hidden');
                loadGalleryAlbums();
            }
        };
    });

    // Controle de Layout (Grid/List)
    const layoutButtons = document.querySelectorAll('.layout-btn');
    const albumGridContainer = document.getElementById('admin-gallery-albums');

    layoutButtons.forEach(btn => {
        btn.onclick = () => {
            const layout = btn.getAttribute('data-layout');
            layoutButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (layout === 'list') {
                albumGridContainer.classList.add('list-view');
            } else {
                albumGridContainer.classList.remove('list-view');
            }
        };
    });

    // Funções Globais para a Tabela (Expostas via Window)
    window.changeRole = async (id, newRole) => {
        if (!confirm(`Mudar cargo para ${newRole}?`)) return;
        try {
            await ApiClient.updateRole(id, newRole);
            Toast.success('Cargo atualizado!');
            loadUsers();
        } catch (err) { Toast.error(err.message); }
    };

    window.deleteUser = async (id) => {
        if (!confirm('Deseja realmente remover este usuário da equipe?')) return;
        try {
            await ApiClient.deleteProfile(id);
            Toast.success('Usuário removido!');
            loadUsers();
        } catch (err) { Toast.error(err.message); }
    };

    window.deleteImage = async (id) => {
        if (!confirm('Deseja realmente excluir esta imagem permanentemente do Google Drive?')) return;
        try {
            await ApiClient.deleteFile(id);
            Toast.success('Imagem excluída!');
            loadGallery(); 
        } catch (err) { Toast.error(err.message); }
    };

    let selectedCoverId = null;

    window.renameAlbum = async (id, currentName) => {
        const modal = document.getElementById('modal-edit-album');
        const nameInput = document.getElementById('edit-album-name');
        const idInput = document.getElementById('edit-album-id');
        const preview = document.getElementById('current-cover-preview');
        const statusText = document.getElementById('upload-status-text');
        
        nameInput.value = currentName;
        idInput.value = id;
        preview.innerHTML = 'Buscando capa atual...';
        statusText.textContent = '';
        selectedFile = null;
        
        modal.classList.add('active');

        try {
            const res = await fetch(`/api/gallery?folderId=${id}`);
            const photos = await res.json();
            const cover = photos.find(p => p.name.toLowerCase().startsWith('capa.'));
            
            if (cover) {
                preview.innerHTML = `<img src="${cover.url}" alt="Capa Atual">`;
            } else {
                preview.innerHTML = '<p style="color: #666">Sem capa definida</p>';
            }
        } catch (err) {
            preview.innerHTML = 'Erro ao carregar prévia.';
        }
    };

    let selectedFile = null;
    const btnTrigger = document.getElementById('btn-trigger-upload');
    const uploadZone = document.getElementById('upload-zone');
    const inputCover = document.getElementById('input-album-cover');
    const statusText = document.getElementById('upload-status-text');

    if (uploadZone) {
        uploadZone.onclick = () => inputCover.click();
        
        inputCover.onchange = (e) => {
            selectedFile = e.target.files[0];
            if (selectedFile) {
                statusText.textContent = `Arquivo selecionado: ${selectedFile.name}`;
                statusText.style.color = 'var(--admin-accent)';
                
                // Gerar prévia instantânea
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('current-cover-preview');
                    preview.innerHTML = `<img src="${event.target.result}" alt="Prévia da Nova Capa" style="border: 2px solid var(--admin-accent)">`;
                };
                reader.readAsDataURL(selectedFile);
            }
        };
    }

    const formEditAlbum = document.getElementById('form-edit-album');
    if (formEditAlbum) {
        formEditAlbum.onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-album-id').value;
            const newName = document.getElementById('edit-album-name').value;
            const btn = formEditAlbum.querySelector('button[type="submit"]');

            try {
                btn.disabled = true;
                btn.textContent = 'Salvando...';
                
                const targetCard = document.querySelector(`.admin-folder-card[data-folder-id="${id}"]`);
                if (targetCard) targetCard.classList.add('loading-card');

                // 1. Renomear álbum
                await ApiClient.renameFile(id, newName);

                // 2. Upload de nova capa se selecionada
                if (selectedFile) {
                    const formData = new FormData();
                    formData.append('cover', selectedFile);
                    
                    const token = AuthManager.getToken();
                    const res = await fetch(`/api/gallery/folders/${id}/cover`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });

                    if (!res.ok) throw new Error('Erro ao subir capa');
                }

                Toast.success('Álbum atualizado com sucesso!');
                document.getElementById('modal-edit-album').classList.remove('active');
                
                setTimeout(() => loadGallery(), 1500);
            } catch (err) {
                Toast.error('Erro ao atualizar: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Salvar Alterações';
            }
        };
    }

    document.getElementById('btn-cancel-edit-album').onclick = () => {
        document.getElementById('modal-edit-album').classList.remove('active');
    };

    window.deleteAlbum = async (id) => {
        if (!confirm('Deseja excluir este álbum e TODAS as fotos dentro dele permanentemente?')) return;
        try {
            await ApiClient.deleteFile(id);
            Toast.success('Álbum excluído!');
            loadGallery();
        } catch (err) { Toast.error(err.message); }
    };

    // Logout
    document.getElementById('btn-logout-admin').onclick = async () => {
        await AuthManager.logout();
        window.location.href = '../index.html';
    };

    // 7. Eventos do Modal de Galeria
    const modalAlbum = document.getElementById('modal-new-album');
    const btnOpenAlbum = document.getElementById('btn-create-album');
    const btnCancelAlbum = document.getElementById('btn-cancel-album');
    const formAlbum = document.getElementById('form-new-album');

    if (btnOpenAlbum) {
        btnOpenAlbum.onclick = () => modalAlbum.classList.add('active');
    }

    if (btnCancelAlbum) {
        btnCancelAlbum.onclick = () => modalAlbum.classList.remove('active');
    }

    if (formAlbum) {
        formAlbum.onsubmit = async (e) => {
            e.preventDefault();
            const name = document.getElementById('album-name').value;
            const btn = formAlbum.querySelector('button[type="submit"]');

            try {
                btn.disabled = true;
                btn.textContent = 'Criando...';
                
                await ApiClient.createFolder(name);
                
                Toast.success('Álbum criado com sucesso no Drive!');
                modalAlbum.classList.remove('active');
                formAlbum.reset();
                loadGallery(); // Recarregar lista
            } catch (err) {
                Toast.error('Erro ao criar álbum: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Criar Álbum';
            }
        };
    }

    // 7. Lógica de Perfil
    async function loadMyProfile() {
        try {
            const user = AuthManager.user;
            if (!user) return;

            const token = AuthManager.getToken();
            const res = await fetch(`/api/admin/profiles/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return;
            const profile = await res.json();

            document.getElementById('profile-email').value = user.email;
            document.getElementById('profile-display-name').value = profile.display_name || '';
            document.getElementById('profile-bio').value = profile.bio || '';
            document.getElementById('profile-show-team').checked = profile.show_on_team || false;
            
            if (profile.avatar_url) {
                document.getElementById('profile-avatar-img').src = profile.avatar_url + `?t=${Date.now()}`;
            }

            const linksList = document.getElementById('social-links-list');
            linksList.innerHTML = '';
            const links = profile.social_links || [];
            links.forEach(link => addSocialLinkRow(link.platform, link.url));
        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
        }
    }

    function addSocialLinkRow(platform = 'instagram', url = '') {
        const list = document.getElementById('social-links-list');
        const div = document.createElement('div');
        div.className = 'social-link-item';
        div.innerHTML = `
            <select class="social-platform">
                <option value="instagram" ${platform === 'instagram' ? 'selected' : ''}>Instagram</option>
                <option value="discord" ${platform === 'discord' ? 'selected' : ''}>Discord</option>
                <option value="twitch" ${platform === 'twitch' ? 'selected' : ''}>Twitch</option>
                <option value="github" ${platform === 'github' ? 'selected' : ''}>GitHub</option>
                <option value="twitter" ${platform === 'twitter' ? 'selected' : ''}>Twitter/X</option>
                <option value="youtube" ${platform === 'youtube' ? 'selected' : ''}>YouTube</option>
            </select>
            <input type="url" class="social-url" placeholder="https://..." value="${url}">
            <button type="button" class="btn-remove-link"><i data-lucide="trash-2"></i></button>
        `;
        
        div.querySelector('.btn-remove-link').onclick = () => div.remove();
        list.appendChild(div);
        lucide.createIcons();
    }

    const btnAddSocial = document.getElementById('btn-add-social');
    if (btnAddSocial) btnAddSocial.onclick = () => addSocialLinkRow();

    // Preview de Avatar
    const avatarInput = document.getElementById('profile-avatar-input');
    if (avatarInput) {
        avatarInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => document.getElementById('profile-avatar-img').src = ev.target.result;
                reader.readAsDataURL(file);
            }
        };
    }

    // Salvar Perfil
    const formProfile = document.getElementById('form-profile');
    if (formProfile) {
        formProfile.onsubmit = async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            try {
                btn.disabled = true;
                btn.textContent = 'Salvando...';

                const user = AuthManager.user;
                const socialLinks = Array.from(document.querySelectorAll('.social-link-item')).map(item => ({
                    platform: item.querySelector('.social-platform').value,
                    url: item.querySelector('.social-url').value
                }));

                const formData = new FormData();
                formData.append('display_name', document.getElementById('profile-display-name').value);
                formData.append('bio', document.getElementById('profile-bio').value);
                formData.append('show_on_team', document.getElementById('profile-show-team').checked);
                formData.append('social_links', JSON.stringify(socialLinks));

                const file = avatarInput.files[0];
                if (file) formData.append('avatar', file);

                const token = AuthManager.getToken();
                const res = await fetch(`/api/admin/profiles/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (!res.ok) throw new Error('Erro ao salvar perfil');

                Toast.success('Perfil atualizado com sucesso!');
                loadMyProfile();
            } catch (err) {
                Toast.error(err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        };
    }

    // Inicialização
    loadMetrics();
    loadMyProfile();
});
