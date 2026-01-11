/**
 * NextAuth API route handler - NextAuth v5 beta
 */

import { handler } from '@/lib/drive/auth';

// NextAuth v5 beta returns an object with a 'handlers' property containing GET and POST
export const GET = (handler as any).handlers?.GET || handler;
export const POST = (handler as any).handlers?.POST || handler;

