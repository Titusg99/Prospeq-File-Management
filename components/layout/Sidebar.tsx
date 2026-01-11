/**
 * Sidebar navigation component
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { path: '/clean-up', label: 'Clean Up' },
  { path: '/ingest', label: 'Ingest' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/templates', label: 'Templates' },
  { path: '/runs', label: 'Runs/Logs' },
  { path: '/settings', label: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4">
        <h1 className="text-xl font-bold">Drive Organizer</h1>
      </div>
      
      <nav className="mt-8 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`block px-4 py-3 transition-colors ${
                isActive ? 'bg-gray-800 border-r-2 border-blue-500' : 'hover:bg-gray-800'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {session?.user && (
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
              {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {session.user.name || 'User'}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {session.user.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}

