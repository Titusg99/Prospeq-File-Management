/**
 * Template tree utilities
 */

import type { FolderTreeNode } from '@/types';
import { nanoid } from 'nanoid';

/**
 * Generate stable key for a tree node
 */
export function generateNodeId(): string {
  return nanoid();
}

/**
 * Resolve path from tree node and ensure keys exist
 */
export function resolvePath(node: FolderTreeNode, basePath = ''): string {
  const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
  node.path = fullPath;
  
  // Ensure key exists
  if (!node.key) {
    node.key = node.id || nanoid();
  }
  
  if (node.children) {
    for (const child of node.children) {
      resolvePath(child, fullPath);
    }
  }
  
  return fullPath;
}

/**
 * Find node by path
 */
export function findNodeByPath(
  tree: FolderTreeNode,
  targetPath: string
): FolderTreeNode | null {
  if (tree.path === targetPath) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeByPath(child, targetPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Get all paths from tree
 */
export function getAllPaths(tree: FolderTreeNode): string[] {
  const paths: string[] = [tree.path];

  if (tree.children) {
    for (const child of tree.children) {
      paths.push(...getAllPaths(child));
    }
  }

  return paths;
}

/**
 * Find node by key
 */
export function findNodeByKey(
  tree: FolderTreeNode,
  targetKey: string
): FolderTreeNode | null {
  if (tree.key === targetKey) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeByKey(child, targetKey);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Create empty root node
 */
export function createRootNode(name = 'Root'): FolderTreeNode {
  const id = generateNodeId();
  const node: FolderTreeNode = {
    id,
    key: id, // Use same ID as key initially
    name,
    path: name,
  };
  return node;
}

