import React, { useState } from 'react';
import { Prerequisite } from '../types';
import { Search, X, Check } from 'lucide-react';
import { normalize } from '../lib/utils';

interface PrerequisitesBarProps {
  prerequisites: Prerequisite[];
  selectedIds: Set<string>;
  spaceCounts: Record<string, number>;
  locked?: boolean;
  onToggle: (prereqId: string) => void;
}

const CORDE_LABELS: Record<string, string> = {
  '2': '2e corde — débutant',
  '3': '3e corde — intermédiaire',
  '4': '4e corde — avancé',
};

const CATEGORY_LABELS: Record<string, string> = {
  esquives: 'Esquives', coups: 'Coups', acrobatiques: 'Acrobatiques', codes: 'Codes',
  monde: 'Le monde de la capoeira', musicalite: 'Musicalité', bases: 'Bases',
  deplacements: 'Déplacements', desequilibrants: 'Déséquilibrants', chamadas: 'Chamadas', maculele: 'Maculêlê'
};

export const PrerequisitesBar: React.FC<PrerequisitesBarProps> = ({
  prerequisites,
  selectedIds,
  spaceCounts,
  locked,
  onToggle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedList = prerequisites.filter((p) => selectedIds.has(p.id));

  const q = normalize(searchQuery);
  const filteredList = prerequisites.filter((p) => !q || normalize(p.label).includes(q));

  const getCordeBadgeStyle = (corde: string) => {
    switch (corde) {
      case '2':
        return 'bg-green-soft text-green';
      case '3':
        return 'bg-ochre-soft text-[#8a6a1f]';
      case '4':
        return 'bg-[#dce8f5] text-[#2c5d8a]';
      default:
        return 'bg-green-soft text-green';
    }
  };

  return (
    <div className="mb-8">
      {/* Summary Bar */}
      <div className="bg-surface border border-border rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-green flex items-center gap-1 mb-2">
            <Check className="w-3.5 h-3.5 text-green" />
            <span>Pré-requis travaillés ({selectedList.length})</span>
          </div>

          {selectedList.length === 0 ? (
            <p className="text-xs text-muted italic">Aucun pré-requis sélectionné pour ce cours</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 items-center">
              {selectedList.slice(0, 10).map((p) => (
                <span
                  key={p.id}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCordeBadgeStyle(p.corde)}`}
                >
                  {p.label}
                </span>
              ))}
              {selectedList.length > 10 && (
                <span className="text-xs text-muted font-semibold px-2 py-1">
                  +{selectedList.length - 10}
                </span>
              )}
            </div>
          )}
        </div>

        {!locked && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-shrink-0 border border-terracotta text-terracotta hover:bg-terracotta-soft text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            {selectedList.length === 0 ? '＋ Sélectionner' : 'Modifier'}
          </button>
        )}
      </div>

      {/* Expanded Selection Panel */}
      {isOpen && !locked && (
        <div className="mt-3 bg-surface border border-border rounded-xl shadow-md overflow-hidden">
          <div className="p-3.5 border-b border-border flex items-center justify-between">
            <span className="text-sm font-bold text-ink">Sélectionner les pré-requis travaillés</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted hover:text-ink p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-3.5 py-2.5 border-b border-border flex items-center gap-2 bg-bg/50">
            <Search className="w-4 h-4 text-muted flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un mouvement, une compétence…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-ink placeholder-muted"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-muted hover:text-ink text-xs">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="p-4 max-h-96 overflow-y-auto space-y-6">
            {filteredList.length === 0 ? (
              <p className="text-center text-xs text-muted py-6 italic">
                Aucun résultat pour « {searchQuery} »
              </p>
            ) : (
              (['2', '3', '4'] as const).map((corde) => {
                const cordeItems = filteredList.filter((p) => p.corde === corde);
                if (cordeItems.length === 0) return null;

                const byCategory: Record<string, Prerequisite[]> = {};
                cordeItems.forEach((p) => {
                  if (!byCategory[p.category]) byCategory[p.category] = [];
                  byCategory[p.category].push(p);
                });

                return (
                  <div key={corde} className="space-y-3">
                    <span
                      className={`inline-block text-xs font-bold px-2.5 py-1 rounded-md ${getCordeBadgeStyle(
                        corde
                      )}`}
                    >
                      {CORDE_LABELS[corde]}
                    </span>

                    <div className="space-y-3 pl-1">
                      {Object.entries(byCategory).map(([cat, items]) => (
                        <div key={cat}>
                          <span className="block text-[11px] font-semibold text-muted uppercase tracking-wider mb-2">
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {items.map((item) => {
                              const isChecked = selectedIds.has(item.id);
                              const count = spaceCounts[item.id] || 0;
                              return (
                                <button
                                  key={item.id}
                                  onClick={() => onToggle(item.id)}
                                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                                    isChecked
                                      ? 'bg-terracotta border-terracotta text-white font-semibold shadow-sm'
                                      : count === 0
                                      ? 'bg-bg border-dashed border-border text-ink/70 hover:border-terracotta'
                                      : 'bg-bg border-border text-ink hover:border-terracotta'
                                  }`}
                                >
                                  {isChecked && <span>✓</span>}
                                  <span>{item.label}</span>
                                  {count > 0 && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                        isChecked ? 'bg-white/30 text-white' : 'bg-black/10 text-muted'
                                      }`}
                                    >
                                      {count}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};