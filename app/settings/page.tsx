/**
 * Settings page
 */

'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SettingsPage() {
  const { data: session, status } = useSession();

  return (
    <PageShell title="Settings" description="Configure workspace and application settings">
      <div className="space-y-6">
        {/* Authentication Section */}
        <Card title="Google Account">
          <div className="space-y-4">
            {status === 'loading' ? (
              <p className="text-gray-600">Loading...</p>
            ) : session?.user ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-semibold text-green-900">Signed in with Google</div>
                    <div className="text-sm text-green-700 mt-1">
                      {session.user.email}
                    </div>
                    {session.user.name && (
                      <div className="text-sm text-green-600 mt-1">
                        {session.user.name}
                      </div>
                    )}
                  </div>
                  <div className="text-green-600">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="danger"
                    onClick={() => signOut({ callbackUrl: '/' })}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-semibold text-yellow-900 mb-2">Not signed in</div>
                  <p className="text-sm text-yellow-700 mb-4">
                    Sign in with your Google account to access and organize your Google Drive files.
                  </p>
                  <Button
                    onClick={() => signIn('google')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Sign in with Google
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Workspace Settings - only show if signed in */}
        {session?.user && (
          <Card title="Workspace Settings">
            <div className="space-y-4">
              <p className="text-gray-600 text-sm">
                Configure your workspace connection to Google Drive. You can select a specific Shared Drive or use your personal Drive.
              </p>
              <div className="space-y-4">
                <Input 
                  label="Workspace Name" 
                  defaultValue={session.user.name || session.user.email || 'My Workspace'}
                  placeholder="Enter workspace name"
                />
                <div>
                  <Input 
                    label="Drive ID (optional)" 
                    placeholder="Leave empty for My Drive, or enter Shared Drive ID"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For Shared Drives, enter the Drive ID. Leave empty to use your personal Google Drive.
                  </p>
                </div>
                <div>
                  <Input 
                    label="Root Folder ID (optional)" 
                    placeholder="Leave empty for Drive root"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Start from a specific folder instead of the Drive root.
                  </p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button>Save Workspace Settings</Button>
              </div>
            </div>
          </Card>
        )}

        <Card title="Application Settings">
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              General application preferences and configuration.
            </p>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" disabled>
                Save Application Settings
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

