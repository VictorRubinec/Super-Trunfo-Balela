const { google } = require('googleapis');
require('dotenv').config();

let auth;

// Prioridade 1: OAuth2
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground'
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    auth = oauth2Client;
} else {
    // Prioridade 2: Service Account
    try {
        const credsEnv = process.env.GOOGLE_CREDENTIALS;
        if (credsEnv && credsEnv.trim().startsWith('{')) {
            auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(credsEnv),
                scopes: ['https://www.googleapis.com/auth/drive'],
            });
        }
    } catch (err) {}
}

const drive = auth ? google.drive({ version: 'v3', auth }) : null;

const DriveService = {
    /**
     * Lista pastas e busca até 6 fotos para o efeito de pilha (1 capa + 5 miniaturas)
     */
    async listFolders() {
        if (!drive) return [];
        const parentId = process.env.DRIVE_FOLDER_ID;
        try {
            const res = await drive.files.list({
                q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id, name)',
                orderBy: 'name'
            });

            const folders = res.data.files;
            
            const foldersWithPreviews = await Promise.all(folders.map(async (folder) => {
                // 1. Tenta achar a capa específica
                const coverRes = await drive.files.list({
                    q: `'${folder.id}' in parents and mimeType contains 'image/' and (name contains 'capa' or name contains 'cover') and trashed = false`,
                    fields: 'files(id, name)',
                    pageSize: 1
                });

                let images = [];
                if (coverRes.data.files[0]) {
                    images.push(coverRes.data.files[0].id);
                }

                // 2. Busca o restante para completar até 6 fotos
                const remainingRes = await drive.files.list({
                    q: `'${folder.id}' in parents and mimeType contains 'image/' and trashed = false`,
                    fields: 'files(id, name)',
                    orderBy: 'modifiedTime desc',
                    pageSize: 6
                });

                remainingRes.data.files.forEach(file => {
                    if (images.length < 6 && !images.includes(file.id)) {
                        images.push(file.id);
                    }
                });

                return {
                    ...folder,
                    previewIds: images
                };
            }));

            return foldersWithPreviews;
        } catch (err) {
            return [];
        }
    },

    async listImages(folderId) {
        if (!drive) return [];
        try {
            let query = '';
            if (folderId) {
                query = `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`;
            } else {
                const folders = await this.listFolders();
                const folderIds = [process.env.DRIVE_FOLDER_ID, ...folders.map(f => f.id)];
                query = `(${folderIds.map(id => `'${id}' in parents`).join(' or ')}) and mimeType contains 'image/' and trashed = false`;
            }

            const res = await drive.files.list({
                q: query,
                fields: 'files(id, name, thumbnailLink, createdTime, owners)',
                orderBy: 'createdTime desc'
            });

            return res.data.files.map(file => ({
                id: file.id,
                name: file.name,
                url: `/api/gallery/image/${file.id}`,
                thumbnail: file.thumbnailLink,
                date: file.createdTime,
                author: file.owners ? file.owners[0].displayName : 'Equipe Balela',
                authorPhoto: file.owners ? file.owners[0].photoLink : null
            }));
        } catch (err) {
            return [];
        }
    },

    async getFileStream(fileId) {
        if (!drive) return null;
        try {
            const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
            return res.data;
        } catch (err) {
            return null;
        }
    },

    /**
     * Busca informações de cota de armazenamento da conta
     */
    async getStorageQuota() {
        if (!drive) return null;
        try {
            const res = await drive.about.get({
                fields: 'storageQuota'
            });
            return {
                total: parseInt(res.data.storageQuota.limit),
                used: parseInt(res.data.storageQuota.usage),
                available: parseInt(res.data.storageQuota.limit) - parseInt(res.data.storageQuota.usage)
            };
        } catch (err) {
            console.error('[DriveService] Erro ao buscar cota:', err.message);
            return null;
        }
    },

    /**
     * Cria uma nova pasta no Drive
     */
    async createFolder(name, parentId = null) {
        if (!drive) return null;
        try {
            const fileMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId || process.env.DRIVE_FOLDER_ID]
            };

            const response = await drive.files.create({
                resource: fileMetadata,
                fields: 'id, name'
            });

            return response.data;
        } catch (error) {
            console.error('[DriveService] Erro ao criar pasta:', error.message);
            throw error;
        }
    },

    /**
     * Exclui um arquivo ou pasta do Drive
     */
    async deleteFile(fileId) {
        if (!drive) return null;
        try {
            await drive.files.delete({ fileId });
            return { success: true };
        } catch (error) {
            console.error('[DriveService] Erro ao excluir:', error.message);
            throw error;
        }
    },

    /**
     * Renomeia um arquivo ou pasta
     */
    async renameFile(fileId, newName) {
        if (!drive) return null;
        try {
            const response = await drive.files.update({
                fileId: fileId,
                resource: { name: newName },
                fields: 'id, name'
            });
            return response.data;
        } catch (error) {
            console.error('[DriveService] Erro ao renomear:', error.message);
            throw error;
        }
    },

    /**
     * Faz upload de um arquivo para o Drive
     */
    async uploadFile(name, folderId, buffer, mimeType) {
        if (!drive) return null;
        try {
            const stream = require('stream');
            const bufferStream = new stream.PassThrough();
            bufferStream.end(buffer);

            const fileMetadata = {
                name: name,
                parents: [folderId]
            };
            const media = {
                mimeType: mimeType,
                body: bufferStream
            };

            const response = await drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name'
            });

            return response.data;
        } catch (error) {
            console.error('[DriveService] Erro no upload:', error.message);
            throw error;
        }
    }
};

module.exports = DriveService;
