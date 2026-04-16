import { CristalModel } from './v1-default.js';
import { EspecialModel } from './v2-especial.js';
import { FullArtModel } from './v3-full-art.js';
import { ThumbModel } from './v4-thumb.js';
import { FullThumbModel } from './v5-full-thumb.js';
import { ShowcaseModel } from './v6-showcase.js';

const MODELS = [
    CristalModel,
    EspecialModel,
    FullArtModel,
    ThumbModel,
    FullThumbModel,
    ShowcaseModel
];

const ModelRegistry = {
    /** Retorna todos os modelos registrados. */
    getAll() {
        return MODELS;
    },

    /** Retorna modelo pelo ID, ou o padrão se não encontrar. */
    getById(id) {
        return MODELS.find(m => m.id === id) ?? MODELS[0];
    },

    /** Retorna o modelo padrão (primeiro da lista). */
    getDefault() {
        return MODELS[0];
    },
};

export default ModelRegistry;
