const fs = require('fs');
const path = require('path');
const supabase = require('../services/supabase-service');

const DATA_DIR = path.join(__dirname, '../../data');
const PHOTOS_DIR = path.join(__dirname, '../../assets/photos');
const BUCKET = process.env.BUCKET_NAME || 'card-photos';

async function migrate() {
    console.log('🚀 Iniciando Migração para o Supabase...');

    try {
        // 1. Migrar Pacotes
        const packagesFile = path.join(DATA_DIR, 'packages.json');
        if (fs.existsSync(packagesFile)) {
            const packages = JSON.parse(fs.readFileSync(packagesFile, 'utf-8'));
            console.log(`📦 Migrando ${packages.length} pacotes...`);
            
            for (const pkg of packages) {
                const { data, error } = await supabase
                    .from('packages')
                    .upsert({
                        id: pkg.id,
                        nome: pkg.nome,
                        cor: pkg.cor
                    }, { onConflict: 'nome' });
                
                if (error) console.error(`❌ Erro no pacote ${pkg.nome}:`, error.message);
            }
        }

        // 2. Migrar Cartas
        const cardsFile = path.join(DATA_DIR, 'cards.json');
        if (fs.existsSync(cardsFile)) {
            const cards = JSON.parse(fs.readFileSync(cardsFile, 'utf-8'));
            console.log(`🃏 Migrando ${cards.length} cartas...`);

            for (const card of cards) {
                let finalPhotoUrl = card.foto;

                // Upload da foto para o Storage se houver arquivo local
                const localFileName = card.foto_arquivo || path.basename(card.foto);
                const localFilePath = path.join(PHOTOS_DIR, localFileName);

                if (fs.existsSync(localFilePath) && !localFileName.includes('http')) {
                    console.log(`   📤 Subindo foto: ${localFileName}`);
                    const fileBody = fs.readFileSync(localFilePath);
                    
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from(BUCKET)
                        .upload(localFileName, fileBody, {
                            contentType: 'image/jpeg',
                            upsert: true
                        });

                    if (uploadError) {
                        console.error(`   ❌ Erro no upload ${localFileName}:`, uploadError.message);
                    } else {
                        const { data: urlData } = supabase.storage
                            .from(BUCKET)
                            .getPublicUrl(localFileName);
                        finalPhotoUrl = urlData.publicUrl;
                    }
                }

                // Inserir no Banco
                const cardData = {
                    id: card.id,
                    titulo: card.titulo,
                    cor: card.cor,
                    tipo: card.tipo,
                    video_origem: card.video_origem,
                    frase: card.frase,
                    foto: finalPhotoUrl,
                    foto_arquivo: card.foto_arquivo,
                    modelo: card.modelo,
                    zoom: card.zoom || 1,
                    pos_x: card.pos_x || 0,
                    pos_y: card.pos_y || 0,
                    attr_ent: card.atributos.entretenimento || 5,
                    attr_vgh: card.atributos.vergonha_alheia || 5,
                    attr_cmp: card.atributos.competencia || 5,
                    attr_bal: card.atributos.balela || 5,
                    attr_clm: card.atributos.climao || 5,
                    criado_em: card.criado_em
                };

                const { error: dbError } = await supabase
                    .from('cards')
                    .upsert(cardData);

                if (dbError) console.error(`   ❌ Erro na carta ${card.titulo}:`, dbError.message);
            }
        }

        console.log('\n✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (err) {
        console.error('\n💥 Erro fatal na migração:', err);
        process.exit(1);
    }
}

migrate();
