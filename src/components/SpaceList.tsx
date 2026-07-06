import { useWorkspace } from '../context/WorkspaceContext';
import { SPACE_SYMBOLS, SPACE_DOT_COLORS } from '../lib/spaceVisuals';

export function SpaceList() {
  const { spaces, currentSpaceId, selectSpace, createSpace } = useWorkspace();

  const getSpaceVisual = (idx: number) => ({
    symbol: SPACE_SYMBOLS[idx % SPACE_SYMBOLS.length],
    color: SPACE_DOT_COLORS[idx % SPACE_DOT_COLORS.length],
  });

  return (
    <div className="sidebar-section spaces">
      <p className="section-label">Espaces</p>
      {spaces.map((s, idx) => {
        const { symbol, color } = getSpaceVisual(idx);
        const isActive = s.id === currentSpaceId;
        return (
          <div
            key={s.id}
            className={`space-row ${isActive ? 'active' : ''}`}
            title={s.name}
            onClick={() => selectSpace(s.id)}
            onDoubleClick={() => {
              const name = prompt('Renommer cet espace', s.name);
              if (name?.trim() && name !== s.name) {
                // TODO: implement renameSpace
              }
            }}
          >
            <div className="space-dot" style={{
              background: isActive ? color.border : color.bg,
              color: isActive ? '#fff' : color.fg,
              borderColor: isActive ? color.border : 'transparent',
            }}>
              {symbol}
            </div>
            <div className="space-name">{s.name}</div>
          </div>
        );
      })}
      <button className="add-link" onClick={createSpace}>＋ Nouvel espace</button>
    </div>
  );
}