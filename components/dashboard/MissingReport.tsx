/**
 * Missing Report Component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { MissingItem } from '@/lib/template/missingReport';

export interface MissingReportProps {
  missingItems: MissingItem[];
  companyName: string;
  runId?: string;
}

export function MissingReport({ missingItems, companyName, runId }: MissingReportProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const essential = missingItems.filter((item) => item.priority === 'Essential' && item.missing);
  const important = missingItems.filter((item) => item.priority === 'Important' && item.missing);
  const niceToHave = missingItems.filter((item) => item.priority === 'Nice-to-have' && item.missing);

  const handleExport = async () => {
    if (!runId) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/missing-report/${runId}/export`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `missing_report_${companyName}_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export missing report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card
      title="Missing Items Report"
      footer={
        runId && (
          <Button onClick={handleExport} disabled={isGenerating}>
            {isGenerating ? 'Generating...' : 'Export as Text'}
          </Button>
        )
      }
    >
      <div className="space-y-6">
        {essential.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-600 mb-2">Essential Missing ({essential.length})</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {essential.map((item) => (
                <li key={item.expectedItemId}>
                  <span className="font-medium">[{item.folderPath}]</span> {item.name}
                  {item.reason && <span className="text-gray-500"> - {item.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {important.length > 0 && (
          <div>
            <h3 className="font-semibold text-yellow-600 mb-2">Important Missing ({important.length})</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {important.map((item) => (
                <li key={item.expectedItemId}>
                  <span className="font-medium">[{item.folderPath}]</span> {item.name}
                  {item.reason && <span className="text-gray-500"> - {item.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {niceToHave.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-600 mb-2">Nice-to-Have Missing ({niceToHave.length})</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {niceToHave.map((item) => (
                <li key={item.expectedItemId}>
                  <span className="font-medium">[{item.folderPath}]</span> {item.name}
                  {item.reason && <span className="text-gray-500"> - {item.reason}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {missingItems.filter((item) => item.missing).length === 0 && (
          <p className="text-gray-600">All expected items are present. ✅</p>
        )}
      </div>
    </Card>
  );
}

