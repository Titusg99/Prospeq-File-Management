/**
 * Home page (redirects to dashboard or sign in)
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { signIn } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Loading...</div>
        </div>
      </PageShell>
    );
  }

  if (status === 'authenticated') {
    return null; // Redirect will happen
  }

  return (
    <PageShell>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Drive Organizer</h1>
            <p className="text-xl text-gray-600 mb-2">
              Organize your Google Drive with AI-powered routing
            </p>
            <p className="text-sm text-gray-500">
              Scan, plan, and organize files using templates and intelligent routing
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600 text-sm">
                Sign in with your Google account to begin organizing your Drive files
              </p>
            </div>
            
            <Button 
              onClick={() => signIn('google')} 
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 inline-block mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              By signing in, you'll grant access to organize files in your Google Drive
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

