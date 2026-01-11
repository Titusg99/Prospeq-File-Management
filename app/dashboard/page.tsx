/**
 * Dashboard page
 */

'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { TemplateCompliance } from '@/components/dashboard/TemplateCompliance';
import { NeedsReviewQueue } from '@/components/dashboard/NeedsReviewQueue';
import { MissingReport } from '@/components/dashboard/MissingReport';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Run, PlanItem } from '@/types';

export default function DashboardPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [needsReview, setNeedsReview] = useState<PlanItem[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [selectedCompanyFolderId, setSelectedCompanyFolderId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch recent runs
    fetch('/api/runs')
      .then((res) => res.json())
      .then((data) => setRuns(data.runs || []))
      .catch(console.error);

    // Fetch items needing review from most recent plan run
    const planRun = runs.find((r) => r.type === 'PLAN' && r.status === 'completed');
    if (planRun) {
      fetch(`/api/runs/${planRun.id}/plan`)
        .then((res) => res.json())
        .then((data) => {
          const needsApproval = data.planItems?.filter((item: PlanItem) => item.needsApproval && item.decision !== 'excluded') || [];
          setNeedsReview(needsApproval);
        })
        .catch(console.error);
    }
  }, [runs.length]);

  const handleGenerateMissingReport = async () => {
    if (!selectedCompanyFolderId) {
      alert('Please select a company folder first');
      return;
    }

    try {
      const response = await fetch('/api/missing-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: 'current-template-id', // TODO: Get from workspace
          companyFolderId: selectedCompanyFolderId,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const { missingItems } = await response.json();
      // Display missing report
      // TODO: Store in state and display
    } catch (error) {
      console.error('Failed to generate missing report:', error);
      alert('Failed to generate missing report');
    }
  };

  const columns = [
    { key: 'id', header: 'ID', render: (item: Run) => <span className="text-xs font-mono">{item.id.slice(0, 8)}</span> },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status', render: (item: Run) => (
      <span className={`px-2 py-1 rounded text-xs ${
        item.status === 'completed' ? 'bg-green-100 text-green-800' :
        item.status === 'running' ? 'bg-blue-100 text-blue-800' :
        item.status === 'failed' ? 'bg-red-100 text-red-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {item.status}
      </span>
    )},
    { key: 'progress', header: 'Progress', render: (item: Run) => (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${item.progress}%` }}></div>
      </div>
    )},
    { key: 'companyName', header: 'Company', render: (item: Run) => item.companyName || '-' },
  ];

  return (
    <PageShell title="Dashboard" description="Overview of compliance, missing items, and duplicates">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Total Workspaces">
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-sm text-gray-600 mt-1">Connected workspaces</p>
          </Card>
          <Card title="Total Templates">
            <div className="text-3xl font-bold text-gray-900">0</div>
            <p className="text-sm text-gray-600 mt-1">Available templates</p>
          </Card>
          <Card title="Recent Runs">
            <div className="text-3xl font-bold text-gray-900">{runs.length}</div>
            <p className="text-sm text-gray-600 mt-1">In the last 24 hours</p>
          </Card>
        </div>

        <Card title="Recent Runs">
          <Table columns={columns} data={runs.slice(0, 10)} emptyMessage="No runs yet" />
        </Card>

        {needsReview.length > 0 && (
          <NeedsReviewQueue
            items={needsReview.map((item) => ({
              id: item.id,
              fileName: item.fileName,
              confidence: item.confidence,
              reason: item.reason,
              runId: item.runId,
            }))}
          />
        )}

        {compliance.length > 0 && (
          <TemplateCompliance
            compliance={compliance}
            template={null as any} // TODO: Get from workspace
          />
        )}

        <Card title="Missing Items Report">
          <div className="space-y-4">
            <Input
              label="Company Folder ID"
              value={selectedCompanyFolderId || ''}
              onChange={(e) => setSelectedCompanyFolderId(e.target.value)}
              placeholder="Enter folder ID to check"
            />
            <Button onClick={handleGenerateMissingReport}>
              Generate Missing Report
            </Button>
            {/* Missing report will be displayed here */}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

