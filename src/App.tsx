import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import { Login } from './pages/Login';
import { SpaceList } from './components/SpaceList';
import { PageList } from './components/PageList';

function AppContent() {
  const { session, loading } = useSession();

  if (loading) {
    return <div className="auth-loading">Chargement de la roda…</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {session ? (
        <>
          <Route path="*" element={
            <div className="app">
              <div className="topbar">
                <button className="hamburger">☰</button>
                <div className="brand">🪘 Roda de Notas</div>
              </div>
              <div className="sidebar">
                <div className="sidebar-header">
                  <div className="brand"><span className="roda-mark">🪘</span> <span className="brand-text">Roda de Notas</span></div>
                </div>
                <SpaceList />
                <PageList />
                <div className="sidebar-footer" style={{ marginTop: 'auto' }}>
                  <button className="signout">Déconnexion</button>
                </div>
              </div>
              <div className="main">
                <div className="main-inner">
                  <p>Phase 2 OK — éditeur vient dans la prochaine phase.</p>
                </div>
              </div>
            </div>
          } />
        </>
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SessionProvider>
        <WorkspaceProvider>
          <AppContent />
        </WorkspaceProvider>
      </SessionProvider>
    </BrowserRouter>
  );
}