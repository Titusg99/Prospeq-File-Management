/**
 * Folder Tree Editor Component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { FolderTreeNode } from '@/types';
import { nanoid } from 'nanoid';

export interface FolderTreeEditorProps {
  tree: FolderTreeNode;
  onChange: (tree: FolderTreeNode) => void;
}

export function FolderTreeEditor({ tree, onChange }: FolderTreeEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set([tree.id]));

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const addChild = (parentId: string) => {
    const newNode: FolderTreeNode = {
      id: nanoid(),
      key: nanoid(),
      name: 'New Folder',
      path: '',
      children: [],
    };

    function addToTree(node: FolderTreeNode): FolderTreeNode {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newNode],
        };
      }
      return {
        ...node,
        children: node.children ? node.children.map(addToTree) : undefined,
      };
    }

    const updated = addToTree(tree);
    onChange(updated);
  };

  const updateNode = (id: string, updates: Partial<FolderTreeNode>) => {
    function updateInTree(node: FolderTreeNode): FolderTreeNode {
      if (node.id === id) {
        return { ...node, ...updates };
      }
      return {
        ...node,
        children: node.children ? node.children.map(updateInTree) : undefined,
      };
    }

    const updated = updateInTree(tree);
    onChange(updated);
  };

  const deleteNode = (id: string) => {
    if (id === tree.id) {
      alert('Cannot delete root node');
      return;
    }

    function removeFromTree(node: FolderTreeNode): FolderTreeNode | null {
      if (node.id === id) {
        return null;
      }
      return {
        ...node,
        children: node.children
          ? node.children.map(removeFromTree).filter((n): n is FolderTreeNode => n !== null)
          : undefined,
      };
    }

    const updated = removeFromTree(tree);
    if (updated) {
      onChange(updated);
    }
  };

  const renderNode = (node: FolderTreeNode, depth = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id} className="pl-4">
        <div className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded">
          <button
            onClick={() => toggleExpand(node.id)}
            className="w-6 h-6 flex items-center justify-center"
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
          </button>
          <Input
            value={node.name}
            onChange={(e) => updateNode(node.id, { name: e.target.value })}
            className="flex-1"
            onBlur={() => {
              // Re-resolve paths after name change
              // TODO: Call resolvePath utility
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => addChild(node.id)}
          >
            Add Child
          </Button>
          {node.id !== tree.id && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (confirm('Delete this folder?')) {
                  deleteNode(node.id);
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-6">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card title="Folder Tree">
      <div className="space-y-2">
        {renderNode(tree)}
      </div>
    </Card>
  );
}

