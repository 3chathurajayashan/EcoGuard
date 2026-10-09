import { useLocation } from 'react-router-dom';

/** Placeholder for the other shared bottom-navigation destinations. */
export function PlaceholderPage() {
  const { pathname } = useLocation();
  const page = pathname === '/' ? 'Home' : pathname.slice(1).replace(/^./, (letter) => letter.toUpperCase());
  return <section className="card empty-state"><span className="empty-icon" aria-hidden="true">🌿</span><h1>{page}</h1><p>Not part of this use case.</p></section>;
}
