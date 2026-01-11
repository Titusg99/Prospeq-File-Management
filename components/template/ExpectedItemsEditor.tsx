/**
 * Expected Items Editor Component
 */

'use client';

import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import type { ExpectedItem, FolderTreeNode } from '@/types';
import { nanoid } from 'nanoid';

export interface ExpectedItemsEditorProps {
  items: ExpectedItem[];
  templateTree: FolderTreeNode;
  selectedFolderKey?: string;
  onItemsChange: (items: ExpectedItem[]) => void;
}

export function ExpectedItemsEditor({
  items,
  templateTree,
  selectedFolderKey,
  onItemsChange,
}: ExpectedItemsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedFolderKey && selectedFolderKey !== 'all') {
      return items.filter((item) => item.folderKey === selectedFolderKey);
    }
    return items;
  }, [items, selectedFolderKey]);

  const folderOptions = useMemo(() => {
    const options: Array<{ key: string; path: string }> = [{ key: 'all', path: 'All Items' }];

    function collectFolders(node: FolderTreeNode, basePath = '') {
      const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
      options.push({ key: node.key, path: fullPath });
      if (node.children) {
        for (const child of node.children) {
          collectFolders(child, fullPath);
        }
      }
    }

    if (templateTree.children) {
      for (const child of templateTree.children) {
        collectFolders(child);
      }
    }

    return options;
  }, [templateTree]);

  const addItem = () => {
    const newItem: ExpectedItem = {
      id: nanoid(),
      templateId: items[0]?.templateId || '',
      folderPath: '',
      folderKey: selectedFolderKey && selectedFolderKey !== 'all' ? selectedFolderKey : '',
      name: 'New Expected Item',
      priority: 'Important',
      searchScope: 'folderOnly',
      createdAt: Date.now(),
    };
    onItemsChange([...items, newItem]);
    setEditingId(newItem.id);
  };

  const updateItem = (id: string, updates: Partial<ExpectedItem>) => {
    onItemsChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    if (confirm('Delete this expected item?')) {
      onItemsChange(items.filter((item) => item.id !== id));
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (item: ExpectedItem) => (
        editingId === item.id ? (
          <Input
            value={item.name}
            onChange={(e) => updateItem(item.id, { name: e.target.value })}
            onBlur={() => setEditingId(null)}
            autoFocus
          />
        ) : (
          <div
            className="cursor-pointer hover:text-blue-600"
            onClick={() => setEditingId(item.id)}
          >
            {item.name}
          </div>
        )
      ),
    },
    {
      key: 'folderPath',
      header: 'Folder',
      render: (item: ExpectedItem) => (
        <div className="text-sm text-gray-600">{item.folderPath}</div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item: ExpectedItem) => (
        editingId === item.id ? (
          <Select
            options={[
              { value: 'Essential', label: 'Essential' },
              { value: 'Important', label: 'Important' },
              { value: 'Nice-to-have', label: 'Nice-to-have' },
            ]}
            value={item.priority}
            onChange={(e) => updateItem(item.id, { priority: e.target.value as any })}
            onBlur={() => setEditingId(null)}
          />
        ) : (
          <span className={`px-2 py-1 rounded text-xs ${
            item.priority === 'Essential' ? 'bg-red-100 text-red-800' :
            item.priority === 'Important' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.priority}
          </span>
        )
      ),
    },
    {
      key: 'searchScope',
      header: 'Scope',
      render: (item: ExpectedItem) => (
        editingId === item.id ? (
          <Select
            options={[
              { value: 'folderOnly', label: 'Folder Only' },
              { value: 'subtree', label: 'Subtree' },
            ]}
            value={item.searchScope}
            onChange={(e) => updateItem(item.id, { searchScope: e.target.value as any })}
            onBlur={() => setEditingId(null)}
          />
        ) : (
          <span className="text-sm text-gray-600">{item.searchScope}</span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: ExpectedItem) => (
        <Button
          size="sm"
          variant="danger"
          onClick={() => deleteItem(item.id)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="Expected Items"
      header={
        <div className="flex items-center gap-4">
          <Select
            options={folderOptions.map((opt) => ({ value: opt.key, label: opt.path }))}
            value={selectedFolderKey || 'all'}
            onChange={(e) => {/* Handle filter change */}}
          />
          <Button onClick={addItem}>Add Item</Button>
        </div>
      }
    >
      <Table columns={columns} data={filteredItems} emptyMessage="No expected items. Add one to get started." />
    </Card>
  );
}

