/**
 * NextAuth configuration with Google OAuth
 */

import { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Lazy import database - only load if needed and available
async function getDbSafely() {
  try {
    const { getDb } = await import('@/lib/db');
    return getDb();
  } catch (error) {
    // Database not available - that's okay, we'll continue without it
    return null;
  }
}

// #region agent log
try {
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:19',message:'Validating secret before authOptions',data:{hasNextAuthSecret:!!process.env.NEXTAUTH_SECRET,hasAuthSecret:!!process.env.AUTH_SECRET},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
} catch(e){}
// #endregion

// Validate required environment variables
const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
if (!secret) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:26',message:'Secret validation failed',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  console.error('NEXTAUTH_SECRET or AUTH_SECRET environment variable is required');
  throw new Error('NEXTAUTH_SECRET or AUTH_SECRET environment variable is required');
}
// #region agent log
try {
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:31',message:'Secret validation passed',data:{hasSecret:!!secret},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
} catch(e){}
// #endregion

// #region agent log
try {
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:40',message:'Creating authOptions',data:{hasSecret:!!secret,hasGoogleClientId:!!process.env.GOOGLE_CLIENT_ID,hasGoogleClientSecret:!!process.env.GOOGLE_CLIENT_SECRET},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
} catch(e){}
// #endregion

let googleProvider: any;
try {
  googleProvider = GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorization: {
      params: {
        scope: [
          'https://www.googleapis.com/auth/drive.readonly',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ].join(' '),
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:61',message:'GoogleProvider created successfully',data:{hasProvider:!!googleProvider},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
} catch (error) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dcf903db-9d50-4016-913e-8cc17c0a7e77',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/drive/auth.ts:65',message:'GoogleProvider creation failed',data:{error:error instanceof Error ? error.message : String(error),stack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion
  throw error;
}

const authConfig: NextAuthOptions = {
  secret,
  debug: process.env.NODE_ENV === 'development',
  providers: [
    googleProvider,
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || !user.email) {
        return false;
      }

      // Try to store tokens in database, but don't fail if database isn't available
      try {
        const db = await getDbSafely();
        if (db) {
          try {
            const existingWorkspace = db
              .prepare('SELECT id FROM workspaces WHERE user_id = ?')
              .get(user.email) as { id: string } | undefined;

            if (existingWorkspace) {
              // Update tokens
              db.prepare(
                `
                UPDATE workspaces 
                SET access_token = ?, refresh_token = ?, updated_at = ?
                WHERE id = ?
              `
              ).run(
                account.access_token || null,
                account.refresh_token || null,
                Date.now(),
                existingWorkspace.id
              );
            } else {
              // Create new workspace
              const { nanoid } = await import('nanoid');
              db.prepare(
                `
                INSERT INTO workspaces (id, user_id, name, access_token, refresh_token, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `
              ).run(
                nanoid(),
                user.email,
                user.name || user.email,
                account.access_token || null,
                account.refresh_token || null,
                Date.now(),
                Date.now()
              );
            }
            console.log('User signed in and tokens stored:', user.email);
          } catch (dbError) {
            console.warn('Database operation failed, continuing without storage:', dbError);
          }
        } else {
          console.warn('Database not available - authentication will work but tokens won\'t be persisted');
        }
      } catch (error) {
        // Don't fail authentication if database fails
        console.warn('Database error during sign-in, continuing:', error);
      }

      // Always allow sign-in, even if database fails
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          const db = await getDbSafely();
          if (db) {
            try {
              const workspace = db
                .prepare('SELECT id, name, drive_id, folder_id FROM workspaces WHERE user_id = ?')
                .get(session.user.email) as {
                id: string;
                name: string;
                driveId?: string;
                folderId?: string;
              } | undefined;

              if (workspace) {
                (session as any).workspaceId = workspace.id;
                (session as any).workspace = workspace;
              }
            } catch (dbError) {
              // Continue without workspace data
              console.warn('Database query failed in session callback:', dbError);
            }
          }
        } catch (error) {
          // Continue without workspace data
          console.warn('Database error in session callback:', error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
};

// Export for backward compatibility
export const authOptions = authConfig;

// NextAuth v5 beta: Create NextAuth instance
const nextAuthResult = NextAuth(authConfig);

// Export handler for API route
export const handler = nextAuthResult;

/**
 * Get session - NextAuth v5 beta
 * Uses getServerSession from next-auth/next (still available in v5 beta)
 * Falls back to cookie-based session retrieval if needed
 */
export async function auth() {
  try {
    // Approach 1: Use getServerSession from next-auth/next (still works in v5 beta)
    const { getServerSession } = await import('next-auth/next');
    if (getServerSession) {
      return await getServerSession(authConfig);
    }
  } catch (error) {
    // getServerSession might not be available, fall back to approach 2
    console.warn('getServerSession not available, trying cookie-based approach:', error);
  }

  // Approach 2: Try to use handler's auth method if available
  if (typeof (nextAuthResult as any).auth === 'function') {
    return await (nextAuthResult as any).auth();
  }

  // Fallback: Return null if both approaches fail
  return null;
}