/**
 * Keyword-based routing (deterministic)
 */

import type { RoutingRule, KeywordRouterResult } from './types';
import type { RoutingRule as TemplateRoutingRule } from '@/types';

/**
 * Route a file using keyword matching
 */
export function routeByKeywords(
  fileName: string,
  rules: (RoutingRule | TemplateRoutingRule)[]
): KeywordRouterResult {
  // Sort rules by priority (higher priority first)
  const sortedRules = [...rules].sort((a, b) => {
    const priorityA = 'priority' in a ? a.priority : 0;
    const priorityB = 'priority' in b ? b.priority : 0;
    return priorityB - priorityA;
  });

  const fileNameLower = fileName.toLowerCase();

  for (const rule of sortedRules) {
    // Check if any keyword matches
    const keywords = 'keywords' in rule ? rule.keywords : [];
    const targetPath = 'targetPath' in rule ? rule.targetPath : '';
    
    const matches = keywords.some((keyword) =>
      fileNameLower.includes(keyword.toLowerCase())
    );

    if (matches && targetPath) {
      return {
        match: true,
        targetPath,
        confidence: 0.9, // High confidence for keyword matches
        matchedRuleId: 'id' in rule ? rule.id : undefined,
      };
    }
  }

  // No match found
  return {
    match: false,
    confidence: 0.0,
  };
}

