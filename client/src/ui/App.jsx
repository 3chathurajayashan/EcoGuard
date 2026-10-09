import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PatrolProvider, usePatrolController } from './PatrolContext.jsx';
import { BottomNav } from './components/BottomNav.jsx';
import { AddWaypointPage } from './pages/AddWaypointPage.jsx';
import { PatrolPage } from './pages/PatrolPage.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';
import { ReportsPage } from './pages/ReportsPage.jsx';

function AppShell() {
  const { role, setRole, offline, setOffline, state } = usePatrolController();
  const location = useLocation();
  const isTracking = state.patrol?.status === 'IN_PROGRESS' && location.pathname.startsWith('/patrol');
  return <div className="app-shell">
    {!isTracking && <header className="app-header"><div className="brand"><span className="brand-mark" aria-hidden="true">🌿</span><div><strong>EcoGuard</strong><span>Wildlife patrols</span></div></div>
      <div className="developer-controls"><label className="role-control">Preview as<select aria-label="Developer role" value={role} onChange={(event) => setRole(event.target.value)}><option>Ranger</option><option>Park Manager</option></select></label>
        <label className="offline-control"><input aria-label="Simulate offline" type="checkbox" checked={offline} onChange={(event) => setOffline(event.target.checked)} /><span>Offline</span></label>
      </div>
    </header>}
    {isTracking && <div className="tracking-topline"><span>🌿 EcoGuard</span><label className="offline-control"><input aria-label="Simulate offline" type="checkbox" checked={offline} onChange={(event) => setOffline(event.target.checked)} /><span>Offline</span></label></div>}
    {state.pendingPatrols?.length > 0 && !location.pathname.startsWith('/patrol') && <div className="global-pending" role="status">◷ {state.pendingPatrols.length} patrol{state.pendingPatrols.length === 1 ? '' : 's'} pending sync</div>}
    <main className={isTracking ? 'main-content tracking-content' : 'main-content'}>
      <Routes><Route path="/" element={<Navigate to="/patrol" replace />} /><Route path="/home" element={<PlaceholderPage />} /><Route path="/map" element={<PlaceholderPage />} /><Route path="/profile" element={<PlaceholderPage />} /><Route path="/patrol" element={<PatrolPage />} /><Route path="/patrol/add-waypoint" element={<AddWaypointPage />} /><Route path="/patrol/summary" element={<PatrolPage />} /><Route path="/reports" element={<ReportsPage />} /><Route path="*" element={<Navigate to="/patrol" replace />} /></Routes>
    </main>
    <BottomNav pending={state.pendingPatrols?.length > 0} />
  </div>;
}

export default function App() {
  return <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><PatrolProvider><AppShell /></PatrolProvider></BrowserRouter>;
}
