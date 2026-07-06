import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { Login } from './pages/Login';

function AppContent() {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="auth-loading">Chargement de la roda…</div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {session ? (
        <Route path="*" element={<EditorLayout />} />
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  );
}

// Layout de base (topbar + sidebar + main) - coquille vide pour l'instant
function EditorLayout() {
  return (
    <div className="app">
      <div className="topbar">
        <button className="hamburger">☰</button>
        <div className="brand">🪘 Roda de Notas</div>
      </div>
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand"><span className="roda-mark">🪘</span> <span className="brand-text">Roda de Notas</span></div>
        </div>
        <div className="sidebar-section spaces">
          <p className="section-label">Espaces</p>
          {/* EspaceList viendra ici en Phase 2 */}
        </div>
        <div className="sidebar-section pages">
          <p className="section-label">Cours</p>
          {/* PageList viendra ici en Phase 2 */}
        </div>
        <div className="sidebar-footer">
          <span className="signout">Déconnexion</span>
        </div>
      </div>
      <div className="main">
        <div className="main-inner">
          <h1 className="font-display page-title-display">Bem-vindo !</h1>
          <p>L'éditeur sera implémenté dans les prochaines phases.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </BrowserRouter>
  );
}