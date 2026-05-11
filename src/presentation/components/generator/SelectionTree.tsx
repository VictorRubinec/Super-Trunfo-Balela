'use client';

import React, { useMemo } from 'react';
import { usePrintStore } from '@/store/printStore';
import { ICard } from '@/core/domain/Card';
import './print.css';

interface SelectionTreeProps {
  cards: ICard[];
}

export const SelectionTree: React.FC<SelectionTreeProps> = ({ cards }) => {
  const { 
    selectedCards, 
    packageMultipliers, 
    setSelectedCard, 
    setPackageMultiplier, 
    togglePackage 
  } = usePrintStore();

  const groupedCards = useMemo(() => {
    const grouped: Record<string, ICard[]> = {};
    if (Array.isArray(cards)) {
      cards.forEach(card => {
        const pkg = card.video_origem || 'Sem Pacote';
        if (!grouped[pkg]) grouped[pkg] = [];
        grouped[pkg].push(card);
      });
    }
    return grouped;
  }, [cards]);

  const isPkgFullySelected = (pkgCards: ICard[]) => {
    return pkgCards.every(c => c.id && selectedCards[c.id]?.selected);
  };

  return (
    <div className="print-tree">
      {Object.keys(groupedCards).sort().map(pkgName => {
        const pkgCards = groupedCards[pkgName];
        const multiplier = packageMultipliers[pkgName] || 1;
        const isAllSelected = isPkgFullySelected(pkgCards);

        return (
          <div key={pkgName} className="print-tree-package">
            <div className="print-package-header">
              <div className="pkg-info">
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={(e) => {
                    const ids = pkgCards.map(c => c.id).filter((id): id is string => !!id);
                    togglePackage(pkgName, ids, e.target.checked);
                  }}
                />
                <span className="pkg-title">{pkgName}</span>
                <span className="pkg-count">({pkgCards.length} cartas)</span>
              </div>
              <div className="pkg-multiplier">
                <label>Multiplicar:</label>
                <input 
                  type="number" 
                  className="pkg-mult-input" 
                  value={multiplier} 
                  min={1} 
                  max={10}
                  onChange={(e) => setPackageMultiplier(pkgName, parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className="print-package-content">
              {pkgCards.map(card => {
                if (!card.id) return null;
                const cardId = card.id;
                const state = selectedCards[cardId] || { selected: false, quantity: 1 };
                
                return (
                  <div key={cardId} className={`print-tree-card ${state.selected ? 'selected' : ''}`}>
                    <label className="print-card-main">
                      <input 
                        type="checkbox" 
                        checked={state.selected}
                        onChange={(e) => setSelectedCard(cardId, { selected: e.target.checked })}
                      />
                      <div className="card-info-main">
                        <span className="card-name">{card.titulo || 'Sem Título'}</span>
                        <span className="card-meta-info">| {card.tipo} | {card.modelo?.toUpperCase()}</span>
                      </div>
                    </label>
                    
                    <div className="card-qty-control">
                      <button 
                        className="qty-btn"
                        onClick={() => setSelectedCard(cardId, { quantity: Math.max(1, state.quantity - 1) })}
                      >-</button>
                      <input 
                        type="number" 
                        className="qty-input" 
                        value={state.quantity}
                        readOnly
                      />
                      <button 
                        className="qty-btn"
                        onClick={() => setSelectedCard(cardId, { quantity: state.quantity + 1 })}
                      >+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
