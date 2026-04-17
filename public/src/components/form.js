import ModelRegistry from '../models/model-registry.js';
import PackageManager from './package-manager.js';

function updateSliderFill(slider) {
    const min = parseFloat(slider.min) || 1;
    const max = parseFloat(slider.max) || 10;
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--fill', `${pct}%`);
}

const Form = {
    el: {},
    currentPhotoDataUrl: null,
    editingCardId: null,   // null = novo card; string = editando card existente
    showingBack:   false,  // Estado do preview: frente ou verso
    
    // Estado da transformação da imagem
    zoom: 1,
    posX: 0,
    posY: 0,
    isDragging: false,
    startX: 0,
    startY: 0,

    init() {
        this.el = {
            form:             document.getElementById('card-form'),
            titulo:           document.getElementById('field-titulo'),
            cor:              document.getElementById('field-cor'),
            tipo:             document.getElementById('field-tipo'),
            entretenimento:   document.getElementById('attr-entretenimento'),
            vergonha:         document.getElementById('attr-vergonha'),
            competencia:      document.getElementById('attr-competencia'),
            balela:           document.getElementById('attr-balela'),
            climao:           document.getElementById('attr-climao'),
            video:            document.getElementById('field-video'),
            frase:            document.getElementById('field-frase'),
            foto:             document.getElementById('field-foto'),
            modelo:           document.getElementById('field-modelo'),
            uploadArea:       document.getElementById('upload-area'),
            uploadPreview:    document.getElementById('upload-preview'),
            uploadPreviewImg: document.getElementById('upload-preview-img'),
            removePhotoBtn:   document.getElementById('btn-remove-photo'),
            submitBtn:        document.getElementById('btn-add-card'),
            
            // Novos controles
            zoomSlider:       document.getElementById('slider-zoom'),
            zoomDisplay:      document.getElementById('disp-zoom'),
            resetTransformBtn: document.getElementById('btn-reset-transform'),
            previewWrapper:   document.querySelector('.preview-wrapper'),
        };

        this._populateModelSelect();

        this._getSliderEls().forEach(s => updateSliderFill(s));
        if (this.el.zoomSlider) updateSliderFill(this.el.zoomSlider);

        this._bindEvents();
        this._bindImageEditorEvents();
        this._updatePreview();    // Renderiza preview com os valores padrão
    },

    _bindEvents() {
        ['titulo', 'cor', 'tipo', 'video', 'frase', 'modelo'].forEach(key => {
            this.el[key]?.addEventListener('input',  () => this._updatePreview());
            this.el[key]?.addEventListener('change', () => this._updatePreview());
        });

        this.el.video?.addEventListener('input', () => {
            this._syncPackageColor();
            this._updatePreview();
        });

        this._getSliderEls().forEach(slider => {
            const dispId = `disp-${slider.id.replace('attr-', '')}`;
            slider.addEventListener('input', () => {
                updateSliderFill(slider);
                const disp = document.getElementById(dispId);
                if (disp) disp.textContent = slider.value;
                this._updatePreview();
            });
        });

        this.el.foto?.addEventListener('change', e => this._handlePhotoUpload(e));
        this.el.removePhotoBtn?.addEventListener('click', () => this._removePhoto());
        
        document.getElementById('btn-flip-preview')?.addEventListener('click', () => {
            this.showingBack = !this.showingBack;
            this._updatePreview();
        });

        this.el.form?.addEventListener('submit', e => {
            e.preventDefault();
            this._handleSubmit();
        });
    },

    _bindImageEditorEvents() {
        this.el.zoomSlider?.addEventListener('input', () => {
            this.zoom = parseFloat(this.el.zoomSlider.value);
            if (this.el.zoomDisplay) {
                this.el.zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
            }
            updateSliderFill(this.el.zoomSlider);
            this._updatePreview();
        });

        this.el.resetTransformBtn?.addEventListener('click', () => {
            this.resetTransform();
        });

        // Eventos de Drag no Preview
        const wrapper = this.el.previewWrapper;
        if (wrapper) {
            wrapper.addEventListener('mousedown', e => this._onDragStart(e));
            
            // Impede o comportamento padrão do navegador de 'pegar' a imagem
            wrapper.addEventListener('dragstart', e => e.preventDefault());
            
            window.addEventListener('mousemove', e => {
                if (this.isDragging) {
                    this._onDragMove(e);
                }
            });
            window.addEventListener('mouseup',   () => this._onDragEnd());
            
            // Touch
            wrapper.addEventListener('touchstart', e => this._onDragStart(e.touches[0]));
            window.addEventListener('touchmove',  e => {
                if (this.isDragging) {
                    e.preventDefault(); // Prevent scrolling while dragging
                    this._onDragMove(e.touches[0]);
                }
            }, { passive: false });
            window.addEventListener('touchend',   () => this._onDragEnd());
        }
    },

    _onDragStart(e) {
        if (this.showingBack || !this.currentPhotoDataUrl) return;
        this.isDragging = true;
        this.startX = e.clientX - this.posX;
        this.startY = e.clientY - this.posY;
        this.el.previewWrapper.style.cursor = 'grabbing';
    },

    _onDragMove(e) {
        if (!this.isDragging) return;
        this.posX = e.clientX - this.startX;
        this.posY = e.clientY - this.startY;
        
        if (this.ticking) return;
        this.ticking = true;
        
        requestAnimationFrame(() => {
            this._applyImageTransform();
            this.ticking = false;
        });
    },

    /** Aplica apenas a transformação da imagem para performance máxima durante drag */
    _applyImageTransform() {
        const photo = document.querySelector('.card .card-photo, .card .card-photo-bg');
        if (photo) {
            photo.style.transform = `translate(${this.posX}px, ${this.posY}px) scale(${this.zoom})`;
        }
    },

    _onDragEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        if (this.el.previewWrapper) {
            this.el.previewWrapper.style.cursor = '';
        }
    },

    resetTransform() {
        this.zoom = 1;
        this.posX = 0;
        this.posY = 0;
        if (this.el.zoomSlider) {
            this.el.zoomSlider.value = 1;
            updateSliderFill(this.el.zoomSlider);
        }
        if (this.el.zoomDisplay) {
            this.el.zoomDisplay.textContent = '100%';
        }
        this._updatePreview();
    },

    _getSliderEls() {
        return ['entretenimento', 'vergonha', 'competencia', 'balela', 'climao']
            .map(k => this.el[k])
            .filter(Boolean);
    },

    _populateModelSelect() {
        const select = this.el.modelo;
        if (!select) return;
        select.innerHTML = ModelRegistry.getAll()
            .map(m => `<option value="${m.id}">${m.name}</option>`)
            .join('');
    },

    getCardData() {
        return {
            id:          this.editingCardId,
            titulo:      this.el.titulo?.value.trim()   || '',
            cor:         this.el.cor?.value             || '#7B2FBE',
            tipo:        this.el.tipo?.value            || '',
            atributos: {
                entretenimento:  parseInt(this.el.entretenimento?.value  || 5),
                vergonha_alheia: parseInt(this.el.vergonha?.value        || 5),
                competencia:     parseInt(this.el.competencia?.value     || 5),
                balela:          parseInt(this.el.balela?.value          || 5),
                climao:          parseInt(this.el.climao?.value          || 5),
            },
            video_origem: this.el.video?.value  || '',
            frase:        this.el.frase?.value  || '',
            foto:         this.currentPhotoDataUrl,
            foto_arquivo: this.el.foto?.files[0]?.name || '',
            modelo:       this.el.modelo?.value || 'v1-default',
            // Novos campos
            zoom:         this.zoom,
            pos_x:        this.posX,
            pos_y:        this.posY,
        };
    },

    populate(cardData) {
        this.editingCardId = cardData.id ?? null;

        if (this.el.titulo)        this.el.titulo.value        = cardData.titulo        || '';
        if (this.el.cor)           this.el.cor.value           = cardData.cor           || '#7B2FBE';
        if (this.el.tipo)          this.el.tipo.value          = cardData.tipo          || '';
        if (this.el.video)         this.el.video.value         = cardData.video_origem  || '';
        if (this.el.frase)         this.el.frase.value         = cardData.frase         || '';
        if (this.el.modelo)        this.el.modelo.value        = cardData.modelo        || 'v1-default';

        // Transformação
        this.zoom = cardData.zoom  ?? 1;
        this.posX = cardData.pos_x ?? 0;
        this.posY = cardData.pos_y ?? 0;

        if (this.el.zoomSlider) {
            this.el.zoomSlider.value = this.zoom;
            updateSliderFill(this.el.zoomSlider);
        }
        if (this.el.zoomDisplay) {
            this.el.zoomDisplay.textContent = `${Math.round(this.zoom * 100)}%`;
        }

        const a = cardData.atributos || {};
        if (this.el.entretenimento) this.el.entretenimento.value = a.entretenimento  ?? 5;
        if (this.el.vergonha)       this.el.vergonha.value       = a.vergonha_alheia ?? 5;
        if (this.el.competencia)    this.el.competencia.value    = a.competencia     ?? 5;
        if (this.el.balela)         this.el.balela.value         = a.balela          ?? 5;
        if (this.el.climao)         this.el.climao.value         = a.climao          ?? 5;

        this._getSliderEls().forEach(s => {
            updateSliderFill(s);
            const dispId = `disp-${s.id.replace('attr-', '')}`;
            const disp = document.getElementById(dispId);
            if (disp) disp.textContent = s.value;
        });

        if (cardData.foto) {
            this.currentPhotoDataUrl = cardData.foto;
            this.el.uploadPreviewImg.src = cardData.foto;
            this.el.uploadPreview.style.display = 'block';
            this.el.uploadArea.style.display    = 'none';
        } else {
            this._removePhoto();
        }

        if (this.el.submitBtn) {
            this.el.submitBtn.innerHTML = '<span>✏</span> Atualizar Carta';
        }

        this._updatePreview();
        this.el.form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    reset() {
        this.editingCardId        = null;
        this.currentPhotoDataUrl  = null;
        this.el.form?.reset();
        this._getSliderEls().forEach(s => {
            updateSliderFill(s);
            const dispId = `disp-${s.id.replace('attr-', '')}`;
            const disp = document.getElementById(dispId);
            if (disp) disp.textContent = s.value;
        });
        this.el.uploadPreview.style.display = 'none';
        this.el.uploadArea.style.display    = 'flex';
        if (this.el.submitBtn) {
            this.el.submitBtn.innerHTML = '<span>✚</span> Adicionar Carta';
        }
        this.resetTransform();
    },

    _syncPackageColor() {
        const packageName = this.el.video?.value;
        if (!packageName) return;
        const color = PackageManager.getColorForPackage(packageName);
        if (color && this.el.cor) {
            this.el.cor.value = color;
        }
    },

    _updatePreview() {
        const cardData = this.getCardData();
        const model    = ModelRegistry.getById(cardData.modelo);
        
        const wrapper = document.querySelector('.preview-wrapper');
        
        if (this.showingBack) {
            wrapper.innerHTML = this._getBackHtml();
            return;
        }

        const currentPreview = wrapper.querySelector('.card');
        if (wrapper && (!currentPreview || !currentPreview.classList.contains(model.id))) {
            wrapper.innerHTML = model.getHtmlStructure();
        }

        model?.update(cardData, 'card-preview');
    },

    _getBackHtml() {
        return `
            <div class="card-back">
                <div class="back-content">
                    <img src="assets/logo/logo-4.png" class="back-logo-main" alt="Balela Logo" />
                </div>
            </div>`;
    },

    _handlePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = ev => {
            this.currentPhotoDataUrl = ev.target.result;
            this.el.uploadPreviewImg.src    = ev.target.result;
            this.el.uploadPreview.style.display = 'block';
            this.el.uploadArea.style.display    = 'none';
            this._updatePreview();
        };
        reader.readAsDataURL(file);
    },

    _removePhoto() {
        this.currentPhotoDataUrl = null;
        if (this.el.foto) this.el.foto.value = '';
        this.el.uploadPreview.style.display = 'none';
        this.el.uploadArea.style.display    = 'flex';
        this._updatePreview();
    },

    _handleSubmit() {
        const cardData = this.getCardData();

        if (!cardData.titulo.trim()) {
            this.el.titulo?.focus();
            this.el.titulo?.classList.add('input-error');
            setTimeout(() => this.el.titulo?.classList.remove('input-error'), 1200);
            return;
        }

        const fotoFile = this.el.foto?.files[0] ?? null;

        const event = new CustomEvent('card:submit', {
            detail: { ...cardData, fotoFile },
        });
        document.dispatchEvent(event);
    },
};

export default Form;
