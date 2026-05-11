import { create } from 'zustand';
import { validateAttribute } from '@/core/utils/cardValidation';

export interface CardData {
  titulo: string;
  tipo: string;
  cor: string;
  modelo: string;
  frase: string;
  video_origem: string;
  foto: string;
  foto_arquivo: string;
  zoom: number;
  pos_x: number;
  pos_y: number;
  atributos: {
    entretenimento: number;
    vergonha_alheia: number;
    competencia: number;
    balela: number;
    climao: number;
  };
}

interface GeneratorState {
  cardData: CardData;
  showBack: boolean;
  updateCardData: (data: Partial<CardData>) => void;
  updateAtributos: (atributos: Partial<CardData['atributos']>) => void;
  toggleShowBack: () => void;
  resetCard: () => void;
}

const initialCardData: CardData = {
  titulo: '',
  tipo: '',
  cor: '#7B2FBE',
  modelo: 'v1',
  frase: '',
  video_origem: '',
  foto: '',
  foto_arquivo: '',
  zoom: 1,
  pos_x: 0,
  pos_y: 0,
  atributos: {
    entretenimento: 5,
    vergonha_alheia: 5,
    competencia: 5,
    balela: 5,
    climao: 5,
  },
};

export const useGeneratorStore = create<GeneratorState>((set) => ({
  cardData: { ...initialCardData },
  showBack: false,
  updateCardData: (data) =>
    set((state) => ({
      cardData: { ...state.cardData, ...data },
    })),
  updateAtributos: (atributos) =>
    set((state) => {
      const validatedAtributos = { ...state.cardData.atributos };
      
      for (const key in atributos) {
        const attrKey = key as keyof CardData['atributos'];
        if (atributos[attrKey] !== undefined) {
          validatedAtributos[attrKey] = validateAttribute(atributos[attrKey]!);
        }
      }

      return {
        cardData: {
          ...state.cardData,
          atributos: validatedAtributos,
        },
      };
    }),
  toggleShowBack: () => set((state) => ({ showBack: !state.showBack })),
  resetCard: () => set({ cardData: { ...initialCardData }, showBack: false }),
}));
