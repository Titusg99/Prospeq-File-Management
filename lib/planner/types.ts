/**
 * Planner types
 */

export interface RoutingDecision {
  fileId: string;
  fileName: string;
  sourcePath: string;
  targetPath: string;
  proposedFolderKey?: string;
  confidence: number;
  routerType: 'keyword' | 'llm' | 'other';
  needsApproval?: boolean;
  reason?: string;
  keywordMatches?: string[];
}

export interface RoutingRule {
  id: string;
  keywords: string[];
  targetPath: string;
  priority: number;
}

export interface KeywordRouterResult {
  match: boolean;
  targetPath?: string;
  confidence: number;
  matchedRuleId?: string;
}

export interface LLMRouterResult {
  targetPath: string;
  confidence: number;
  reasoning?: string;
}

