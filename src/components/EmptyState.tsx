import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  hasSpace: boolean;
  onCreatePage: () => void;
  onCreateSpace: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasSpace,
  onCreatePage,
  onCreateSpace,
}) => {
  return (
    <div className="text-center py-20 text-muted">
      <div className="text-4xl mb-4">🪘</div>
      <h2 className="text-xl font-bold font-display text-ink mb-2">Bem-vindo !</h2>
      <p className="text-sm mb-6">
        {hasSpace
          ? 'Sélectionnez ou créez un cours pour commencer à noter vos séances.'
          : 'Créez votre premier espace pour organiser vos cours de capoeira.'}
      </p>
      {hasSpace ? (
        <button
          onClick={onCreatePage}
          className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau cours</span>
        </button>
      ) : (
        <button
          onClick={onCreateSpace}
          className="bg-terracotta text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Créer un espace</span>
        </button>
      )}
    </div>
  );
};