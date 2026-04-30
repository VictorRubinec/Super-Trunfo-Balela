const DriveService = require('./server/services/driveService');
const path = require('path');
const fs = require('fs');

async function uploadLogos() {
    const logoDir = path.join(__dirname, 'public/assets/logo');
    
    if (!fs.existsSync(logoDir)) {
        console.error('Diretório de logos não encontrado!');
        return;
    }

    const files = fs.readdirSync(logoDir).filter(f => f.endsWith('.png'));
    
    console.log(`🚀 Iniciando upload de ${files.length} logos para o Drive...`);

    for (const file of files) {
        const filePath = path.join(logoDir, file);
        try {
            console.log(`Enviando: ${file}...`);
            await DriveService.uploadFile(filePath, file, 'image/png');
        } catch (err) {
            console.error(`❌ Falha ao enviar ${file}:`, err.message);
        }
    }

    console.log('\n✨ Todos os uploads foram processados. Verifique sua galeria!');
}

uploadLogos();
