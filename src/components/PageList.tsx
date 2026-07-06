import { useWorkspace } from '../context/WorkspaceContext';

export function PageList() {
  const { pages, currentPageId, currentSpaceId, createPage } = useWorkspace();

  if (!currentSpaceId) return null;

  return (
    <div className="sidebar-section pages">
      <p className="section-label">Cours</p>
      {pages.map(p => (
        <div
          key={p.id}
          className={`page-row ${p.id === currentPageId ? 'active' : ''}`}
          title={p.title}
        >
          <span className="ptitle">{p.title || 'Sans titre'}</span>
          {/* Actions seront ajoutées au fur et à mesure */}
        </div>
      ))}
      <button className="add-link" onClick={createPage}>＋ Nouveau cours</button>
    </div>
  );
}