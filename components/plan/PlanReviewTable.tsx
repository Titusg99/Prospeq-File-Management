/**
 * Plan Review Table Component
 */

'use client';

import { useState, useMemo } from 'react';
import { Table } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import type { PlanItem } from '@/types';

export interface PlanReviewTableProps {
  planItems: PlanItem[];
  templateFolderKeys: Array<{ key: string; path: string }>;
  onDecisionChange: (id: string, decision: 'approved' | 'overridden' | 'excluded', finalFolderKey?: string) => void;
  onBulkAction?: (action: 'approve-all' | 'approve-high-confidence' | 'exclude-selected', ids?: string[]) => void;
}

type FilterType = 'all' | 'needs-approval' | 'excluded';

export function PlanReviewTable({
  planItems,
  templateFolderKeys,
  onDecisionChange,
  onBulkAction,
}: PlanReviewTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'needs-approval':
        return planItems.filter((item) => item.needsApproval && item.decision !== 'excluded');
      case 'excluded':
        return planItems.filter((item) => item.decision === 'excluded');
      default:
        return planItems;
    }
  }, [planItems, filter]);

  const handleDecisionChange = (item: PlanItem, decision: 'approved' | 'overridden' | 'excluded') => {
    let finalFolderKey = item.proposedFolderKey;

    if (decision === 'overridden') {
      finalFolderKey = overrides.get(item.id) || item.proposedFolderKey;
      if (!finalFolderKey) {
        // Default to first folder key if none selected
        finalFolderKey = templateFolderKeys[0]?.key || item.proposedFolderKey || '';
      }
    } else if (decision === 'approved') {
      finalFolderKey = item.proposedFolderKey;
    }

    onDecisionChange(item.id, decision, finalFolderKey);
  };

  const handleOverrideChange = (itemId: string, folderKey: string) => {
    setOverrides(new Map(overrides).set(itemId, folderKey));
    // Auto-set decision to overridden when override is selected
    const item = planItems.find((p) => p.id === itemId);
    if (item) {
      onDecisionChange(itemId, 'overridden', folderKey);
    }
  };

  const handleBulkApprove = () => {
    if (onBulkAction) {
      if (filter === 'needs-approval') {
        const highConfidenceIds = filteredItems
          .filter((item) => item.confidence >= 0.7)
          .map((item) => item.id);
        onBulkAction('approve-high-confidence', highConfidenceIds);
      } else {
        onBulkAction('approve-all');
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)));
    }
  };

  const handleBulkExclude = () => {
    if (onBulkAction && selectedIds.size > 0) {
      onBulkAction('exclude-selected', Array.from(selectedIds));
    }
  };

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
          onChange={handleSelectAll}
          className="rounded border-gray-300"
        />
      ),
      render: (item: PlanItem) => (
        <input
          type="checkbox"
          checked={selectedIds.has(item.id)}
          onChange={(e) => {
            const newSelected = new Set(selectedIds);
            if (e.target.checked) {
              newSelected.add(item.id);
            } else {
              newSelected.delete(item.id);
            }
            setSelectedIds(newSelected);
          }}
          className="rounded border-gray-300"
        />
      ),
    },
    {
      key: 'fileName',
      header: 'File',
      render: (item: PlanItem) => (
        <div className={item.needsApproval ? 'font-semibold text-red-600' : ''}>
          {item.fileName}
        </div>
      ),
    },
    {
      key: 'sourcePath',
      header: 'Current Path',
      render: (item: PlanItem) => <div className="text-sm text-gray-600">{item.sourcePath}</div>,
    },
    {
      key: 'targetPath',
      header: 'Proposed Destination',
      render: (item: PlanItem) => (
        <div className="text-sm">{item.targetPath || 'Other'}</div>
      ),
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (item: PlanItem) => (
        <div className={confidenceColor(item.confidence)}>
          {(item.confidence * 100).toFixed(0)}%
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (item: PlanItem) => (
        <div className="text-sm text-gray-600 max-w-xs truncate">{item.reason || '-'}</div>
      ),
    },
    {
      key: 'decision',
      header: 'Decision',
      render: (item: PlanItem) => (
        <div className="space-y-2">
          <div className="flex gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name={`decision-${item.id}`}
                checked={item.decision === 'approved'}
                onChange={() => handleDecisionChange(item, 'approved')}
                className="rounded border-gray-300"
              />
              Approve
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name={`decision-${item.id}`}
                checked={item.decision === 'overridden'}
                onChange={() => handleDecisionChange(item, 'overridden')}
                className="rounded border-gray-300"
              />
              Override
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name={`decision-${item.id}`}
                checked={item.decision === 'excluded'}
                onChange={() => handleDecisionChange(item, 'excluded')}
                className="rounded border-gray-300"
              />
              Exclude
            </label>
          </div>
          {item.decision === 'overridden' && (
            <Select
              options={templateFolderKeys.map((fk) => ({
                value: fk.key,
                label: fk.path,
              }))}
              value={overrides.get(item.id) || item.proposedFolderKey || ''}
              onChange={(e) => handleOverrideChange(item.id, e.target.value)}
              className="text-sm"
            />
          )}
        </div>
      ),
    },
  ];

  const needsApprovalCount = planItems.filter((item) => item.needsApproval && item.decision !== 'excluded').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({planItems.length})
            </Button>
            <Button
              variant={filter === 'needs-approval' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('needs-approval')}
            >
              Needs Approval ({needsApprovalCount})
            </Button>
            <Button
              variant={filter === 'excluded' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter('excluded')}
            >
              Excluded ({planItems.filter((item) => item.decision === 'excluded').length})
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleBulkApprove}>
            {filter === 'needs-approval' ? 'Approve High Confidence' : 'Approve All'}
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleBulkExclude}>
              Exclude Selected ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <Table columns={columns} data={filteredItems} emptyMessage="No plan items to review" />
    </div>
  );
}

