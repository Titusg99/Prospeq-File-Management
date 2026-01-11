/**
 * Root layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionProvider } from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Drive Organizer',
  description: 'Organize your Google Drive with AI-powered routing',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col">{children}</div>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}

