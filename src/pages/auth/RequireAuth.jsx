import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../app/SessionProvider.jsx';

/** Guards the app shell: signed-out visitors go to /login and come back to the same page afterwards. */
export default function RequireAuth({ children }) {
  const { isAuthenticated, signedOut } = useSession();
  const location = useLocation();
  // Explicit sign-out: plain /login with a "You've signed out" notice and the email kept.
  if (!isAuthenticated && signedOut) return <Navigate to="/login" replace state={{ signedOut: true, email: signedOut.email }} />;
  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}
