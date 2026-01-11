/**
 * Template Compliance Checklist Component
 */

'use client';

import { Card } from '@/components/ui/Card';
import type { Template } from '@/types';

export interface ComplianceItem {
  folderKey: string;
  folderPath: string;
  status: 'exists' | 'empty' | 'missing';
  fileCount?: number;
  webViewLink?: string;
}

export interface TemplateComplianceProps {
  compliance: ComplianceItem[];
  template: Template;
}

export function TemplateCompliance({ compliance, template }: TemplateComplianceProps) {
  const statusIcon = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'exists':
        return '✅';
      case 'empty':
        return '⚠️';
      case 'missing':
        return '❌';
    }
  };

  const statusLabel = (status: ComplianceItem['status']) => {
    switch (status) {
      case 'exists':
        return 'Exists';
      case 'empty':
        return 'Empty';
      case 'missing':
        return 'Missing';
    }
  };

  const getStatusCounts = () => {
    return {
      exists: compliance.filter((c) => c.status === 'exists').length,
      empty: compliance.filter((c) => c.status === 'empty').length,
      missing: compliance.filter((c) => c.status === 'missing').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <Card title="Template Compliance">
      <div className="space-y-4">
        <div className="flex gap-4 text-sm">
          <div className="text-green-600">
            ✅ Exists: {counts.exists}
          </div>
          <div className="text-yellow-600">
            ⚠️ Empty: {counts.empty}
          </div>
          <div className="text-red-600">
            ❌ Missing: {counts.missing}
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {compliance.map((item) => (
            <div
              key={item.folderKey}
              className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{statusIcon(item.status)}</span>
                <div>
                  <div className="font-medium">{item.folderPath}</div>
                  <div className="text-xs text-gray-500">
                    {statusLabel(item.status)}
                    {item.fileCount !== undefined && ` • ${item.fileCount} files`}
                  </div>
                </div>
              </div>
              {item.webViewLink && (
                <a
                  href={item.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Open in Drive
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

