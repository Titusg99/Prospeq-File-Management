/**
 * Needs Review Queue Component
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export interface ReviewItem {
  id: string;
  fileName: string;
  confidence: number;
  reason?: string;
  runId: string;
}

export interface NeedsReviewQueueProps {
  items: ReviewItem[];
}

export function NeedsReviewQueue({ items }: NeedsReviewQueueProps) {
  if (items.length === 0) {
    return (
      <Card title="Needs Review Queue">
        <p className="text-gray-600">No items need review. All plans have been approved.</p>
      </Card>
    );
  }

  return (
    <Card
      title={`Needs Review Queue (${items.length})`}
      footer={
        <Link href={`/clean-up?runId=${items[0]?.runId}`}>
          <Button>Review Plan</Button>
        </Link>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-gray-600 mb-4">
          The following items have low confidence routing decisions and need manual review.
        </p>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.slice(0, 10).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 border border-gray-200 rounded hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{item.fileName}</div>
                {item.reason && (
                  <div className="text-xs text-gray-500 truncate">{item.reason}</div>
                )}
              </div>
              <div className="text-sm text-red-600 font-medium">
                {(item.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
          {items.length > 10 && (
            <div className="text-sm text-gray-500 text-center py-2">
              + {items.length - 10} more items
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

