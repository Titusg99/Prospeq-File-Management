/**
 * Templates list page
 */

'use client';

import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function TemplatesPage() {
  // Stub data
  const templates: any[] = [];

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'version', header: 'Version' },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <Link href={`/templates/${item.id}`}>
          <Button size="sm" variant="secondary">Edit</Button>
        </Link>
      ),
    },
  ];

  return (
    <PageShell
      title="Templates"
      description="Manage folder structure templates and routing rules"
      headerActions={
        <Link href="/templates/new">
          <Button>Create Template</Button>
        </Link>
      }
    >
      <div className="space-y-6">
        <Card>
          <Table columns={columns} data={templates} emptyMessage="No templates yet. Create one to get started." />
        </Card>
      </div>
    </PageShell>
  );
}

