/**
 * Page shell component (layout wrapper)
 */

'use client';

import { ReactNode } from 'react';

export interface PageShellProps {
  title?: string;
  description?: string;
  children: ReactNode;
  headerActions?: ReactNode;
}

export function PageShell({ title, description, children, headerActions }: PageShellProps) {
  return (
    <div className="flex-1 flex flex-col">
      {(title || description || headerActions) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div>
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
            </div>
            {headerActions && <div>{headerActions}</div>}
          </div>
        </div>
      )}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

