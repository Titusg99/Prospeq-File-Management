/**
 * Planner: Combines keyword and LLM routers
 */

import { routeByKeywords } from './keywordRouter';
import { routeByLLM, validateLLMOutput } from './llmRouter';
import type { RoutingDecision, RoutingRule } from './types';
import type { DriveFile, Template } from '@/types';
import { logInfo, logWarn } from '@/lib/utils/logging';
import { getAllPaths, findNodeByKey } from '@/lib/template/tree';

export interface PlanOptions {
  files: DriveFile[];
  template: Template;
  llmThreshold?: number; // Confidence threshold below which to use LLM
  approvalThreshold?: number; // Confidence threshold below which needs approval (default 0.7)
}

/**
 * Generate routing plan for files
 */
export async function generatePlan(options: PlanOptions): Promise<RoutingDecision[]> {
  const decisions: RoutingDecision[] = [];
  const llmThreshold = options.llmThreshold ?? 0.5;
  const approvalThreshold = options.approvalThreshold ?? 0.7;

  // Get all available folder keys from template
  const allPaths = getAllPaths(options.template.folderTree);
  const allKeys = options.template.folderTree.children
    ? options.template.folderTree.children.map((child) => child.key)
    : [];

  // Build mapping of paths to keys
  const pathToKey = new Map<string, string>();
  function buildPathMap(node: typeof options.template.folderTree, basePath = '') {
    const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
    if (node.key) {
      pathToKey.set(fullPath, node.key);
    }
    if (node.children) {
      for (const child of node.children) {
        buildPathMap(child, fullPath);
      }
    }
  }
  buildPathMap(options.template.folderTree);

  // Find "Other" folder key
  function findOtherNode(node: typeof options.template.folderTree): typeof options.template.folderTree | null {
    if (node.name.toLowerCase() === 'other') {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = findOtherNode(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  const otherNode = findOtherNode(options.template.folderTree);
  const otherKey = otherNode?.key || (options.template.folderTree.children?.find((c) => c.name.toLowerCase() === 'other')?.key || 'other');

  for (const file of options.files) {
    // Try keyword router first
    const keywordResult = routeByKeywords(file.name, options.template.routingRules);

    if (keywordResult.match && keywordResult.confidence >= llmThreshold) {
      // Keyword match is good enough
      const targetKey = keywordResult.targetPath
        ? pathToKey.get(keywordResult.targetPath) || otherKey
        : otherKey;

      decisions.push({
        fileId: file.id,
        fileName: file.name,
        sourcePath: file.path || file.name,
        targetPath: keywordResult.targetPath || 'Other',
        proposedFolderKey: targetKey,
        confidence: keywordResult.confidence,
        routerType: 'keyword',
        needsApproval: keywordResult.confidence < approvalThreshold,
        reason: `Matched rule: ${keywordResult.matchedRuleId}`,
        keywordMatches: keywordResult.matchedRuleId ? [keywordResult.matchedRuleId] : undefined,
      });
      continue;
    }

    // Use LLM router for ambiguous cases
    try {
      const llmResult = await routeByLLM(
        file.name,
        file.path || file.name,
        allPaths,
        options.template,
        options.template.routingRules
      );

      // Validate LLM output
      if (!validateLLMOutput(llmResult)) {
        logWarn('Invalid LLM output, defaulting to Other', {
          fileName: file.name,
          output: llmResult,
        });
        decisions.push({
          fileId: file.id,
          fileName: file.name,
          sourcePath: file.path || file.name,
          targetPath: 'Other',
          proposedFolderKey: otherKey,
          confidence: 0.0,
          routerType: 'other',
          needsApproval: true,
          reason: 'Invalid LLM output',
        });
        continue;
      }

      const targetKey = pathToKey.get(llmResult.targetPath) || otherKey;

      decisions.push({
        fileId: file.id,
        fileName: file.name,
        sourcePath: file.path || file.name,
        targetPath: llmResult.targetPath,
        proposedFolderKey: targetKey,
        confidence: llmResult.confidence,
        routerType: 'llm',
        needsApproval: llmResult.confidence < approvalThreshold,
        reason: llmResult.reasoning,
      });
    } catch (error) {
      // LLM failed, default to Other
      logWarn('LLM routing failed, defaulting to Other', {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
      decisions.push({
        fileId: file.id,
        fileName: file.name,
        sourcePath: file.path || file.name,
        targetPath: 'Other',
        proposedFolderKey: otherKey,
        confidence: 0.0,
        routerType: 'other',
        needsApproval: true,
        reason: `LLM error: ${error instanceof Error ? error.message : 'Unknown'}`,
      });
    }
  }

  const needsApprovalCount = decisions.filter((d) => d.needsApproval).length;

  logInfo('Plan generated', {
    totalFiles: options.files.length,
    decisions: decisions.length,
    keywordMatches: decisions.filter((d) => d.routerType === 'keyword').length,
    llmMatches: decisions.filter((d) => d.routerType === 'llm').length,
    other: decisions.filter((d) => d.routerType === 'other').length,
    needsApproval: needsApprovalCount,
  });

  return decisions;
}

