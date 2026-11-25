import { createContext, ReactNode, useContext, useState } from 'react';
import { getToken, setToken } from './api';

export type Role = 'SUPER_ADMIN' | 'ZONAL_FRANCHISE' | 'REMOTE_FRANCHISE' | 'MEMBER' | 'CUSTOMER';

/** Reads the role out of the (unverified, display-only) token payload. The server re-checks it on every call. */
const roleOf = (token: string | null): Role | null => {
  if (!token) return null;
  try { return (JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role as Role) ?? 'MEMBER'; } catch { return 'MEMBER'; } // demo mode uses a plain token
};
export const homeFor = (_role: Role | null) => '/dashboard'; // franchise and head-office accounts use the Franchise & Admin app
export const isMemberRole = (role: Role | null) => role === 'MEMBER' || role === 'CUSTOMER' || role === null;

interface AuthCtx { authed: boolean; role: Role | null; signIn: (token: string) => void; signOut: () => void }
const Ctx = createContext<AuthCtx>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(getToken());
  const value: AuthCtx = {
    authed: !!token, role: roleOf(token),
    signIn: (t) => { setToken(t); setTok(t); },
    signOut: () => { setToken(null); setTok(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
