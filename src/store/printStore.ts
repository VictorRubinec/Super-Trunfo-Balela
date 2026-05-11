import { create } from 'zustand';
import { PageFormat, PrintSettings } from '@/core/domain/Export';

export interface SelectedCardState {
  selected: boolean;
  quantity: number;
}

interface PrintStore {
  // Estado de Seleção
  selectedCards: Record<string, SelectedCardState>;
  packageMultipliers: Record<string, number>;
  
  // Configurações
  settings: PrintSettings;
  
  // Ações
  setSelectedCard: (id: string, state: Partial<SelectedCardState>) => void;
  setPackageMultiplier: (pkgName: string, multiplier: number) => void;
  togglePackage: (pkgName: string, cards: string[], selected: boolean) => void;
  toggleAll: (cards: string[], selected: boolean) => void;
  updateSettings: (settings: Partial<PrintSettings>) => void;
  resetSelection: () => void;
}

export const usePrintStore = create<PrintStore>((set) => ({
  selectedCards: {},
  packageMultipliers: {},
  settings: {
    format: 'a4',
    bleed: 3,
    useBleed: true,
    margin: 10,
    cutmarks: true,
    projectName: `Impressao_Balela_${new Date().toISOString().split('T')[0]}`,
  },

  setSelectedCard: (id, state) => set((s) => ({
    selectedCards: {
      ...s.selectedCards,
      [id]: { ...(s.selectedCards[id] || { selected: true, quantity: 1 }), ...state }
    }
  })),

  setPackageMultiplier: (pkgName, multiplier) => set((s) => ({
    packageMultipliers: { ...s.packageMultipliers, [pkgName]: multiplier }
  })),

  togglePackage: (pkgName, cards, selected) => set((s) => {
    const newSelected = { ...s.selectedCards };
    cards.forEach(id => {
      newSelected[id] = { ...(newSelected[id] || { quantity: 1 }), selected };
    });
    return { selectedCards: newSelected };
  }),

  toggleAll: (cards, selected) => set(() => {
    const newSelected: Record<string, SelectedCardState> = {};
    cards.forEach(id => {
      newSelected[id] = { selected, quantity: 1 };
    });
    return { selectedCards: newSelected };
  }),

  updateSettings: (newSettings) => set((s) => ({
    settings: { ...s.settings, ...newSettings }
  })),

  resetSelection: () => set({ selectedCards: {}, packageMultipliers: {} }),
}));
