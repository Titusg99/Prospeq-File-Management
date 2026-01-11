/**
 * Runs/Logs page
 */

'use client';

import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';

export default function RunsPage() {
  // Stub data
  const runs: any[] = [];

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'type', header: 'Type' },
    { key: 'status', header: 'Status' },
    { key: 'progress', header: 'Progress', render: (item: any) => `${item.progress}%` },
    { key: 'startedAt', header: 'Started', render: (item: any) => item.startedAt ? new Date(item.startedAt).toLocaleString() : '-' },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <PageShell title="Runs & Logs" description="View execution runs and logs">
      <div className="space-y-6">
        <Card>
          <div className="mb-4">
            <Select
              label="Filter by Status"
              options={statusOptions}
              defaultValue="all"
            />
          </div>
          <Table columns={columns} data={runs} emptyMessage="No runs yet" />
        </Card>

        <Card title="Log Events">
          <p className="text-gray-600">Log viewer UI coming soon.</p>
          <p className="text-sm text-gray-500 mt-2">
            View detailed logs for each run including COPY, PROMOTE, and other operations.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}

