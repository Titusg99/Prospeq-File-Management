/**
 * Session provider wrapper for NextAuth
 */

'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}

