import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export const FRANCHISE_APP = import.meta.env.VITE_FRANCHISE_APP_URL ?? 'http://localhost:5174';

/** A franchise or head-office account signed in to the member app. They have their own app. */
export default function WrongApp() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="center">
      <div className="card narrow">
        <h2>This is the member app</h2>
        <p className="muted">Franchise and head-office accounts work in the Franchise &amp; Admin app.</p>
        <a className="btn" href={FRANCHISE_APP}>Open Franchise &amp; Admin</a>
        <button className="link-btn center-link" onClick={() => { signOut(); nav('/login'); }}>Sign out</button>
      </div>
    </div>
  );
}
