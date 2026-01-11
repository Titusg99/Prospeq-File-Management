/**
 * Inventory Counts Table Component
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import Link from 'next/link';

export interface CategoryCount {
  category: string;
  folderKey: string;
  fileCount: number;
  lastModified?: string;
  folderId?: string;
  webViewLink?: string;
}

export interface InventoryCountsProps {
  counts: CategoryCount[];
}

export function InventoryCounts({ counts }: InventoryCountsProps) {
  const columns = [
    {
      key: 'category',
      header: 'Category',
      render: (item: CategoryCount) => (
        <div className="font-medium">{item.category}</div>
      ),
    },
    {
      key: 'fileCount',
      header: 'File Count',
      render: (item: CategoryCount) => (
        <div className="text-lg font-semibold">{item.fileCount}</div>
      ),
    },
    {
      key: 'lastModified',
      header: 'Last Modified',
      render: (item: CategoryCount) => (
        <div className="text-sm text-gray-600">
          {item.lastModified ? new Date(item.lastModified).toLocaleDateString() : '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: CategoryCount) => (
        item.webViewLink ? (
          <a
            href={item.webViewLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            Open in Drive
          </a>
        ) : null
      ),
    },
  ];

  return (
    <Card title="Inventory by Category">
      <Table columns={columns} data={counts} emptyMessage="No inventory data available" />
    </Card>
  );
}

