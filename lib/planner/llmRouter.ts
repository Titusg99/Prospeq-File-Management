/**
 * LLM-based routing (for ambiguous cases)
 * Uses OpenAI API to route files when keyword matching is insufficient
 */

import OpenAI from 'openai';
import type { LLMRouterResult, RoutingRule } from './types';
import type { Template } from '@/types';
import { logInfo, logWarn, logError } from '@/lib/utils/logging';

const openaiApiKey = process.env.OPENAI_API_KEY;

/**
 * Initialize OpenAI client (returns null if API key is not configured)
 */
function getOpenAIClient(): OpenAI | null {
  if (!openaiApiKey) {
    logWarn('OPENAI_API_KEY not configured, LLM routing will default to Other');
    return null;
  }

  try {
    return new OpenAI({
      apiKey: openaiApiKey,
    });
  } catch (error) {
    logError('Failed to initialize OpenAI client', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Route a file using LLM
 * Provides context about available folders and asks LLM to route the file
 */
export async function routeByLLM(
  fileName: string,
  sourcePath: string,
  availablePaths: string[],
  template?: Template,
  routingRules?: RoutingRule[]
): Promise<LLMRouterResult> {
  const client = getOpenAIClient();

  if (!client) {
    // Fallback to Other if OpenAI is not configured
    const otherPath = availablePaths.find((path) => path.toLowerCase().includes('other')) || 'Other';
    return {
      targetPath: otherPath,
      confidence: 0.2,
      reasoning: 'OpenAI API key not configured - defaulting to Other',
    };
  }

  try {
    // Find the "Other" folder as fallback
    const otherPath = availablePaths.find((path) => path.toLowerCase().includes('other')) || 'Other';

    // Build context about available folders
    const folderList = availablePaths.map((path, index) => `  ${index + 1}. ${path}`).join('\n');

    // Include routing rules/examples if available
    let routingRulesContext = '';
    if (routingRules && routingRules.length > 0) {
      const rulesExamples = routingRules
        .slice(0, 10) // Limit to first 10 rules to keep prompt manageable
        .map((rule) => `  - Keywords: ${rule.keywords.join(', ')} → ${rule.targetPath}`)
        .join('\n');
      routingRulesContext = `\n\nExample routing rules (for reference):\n${rulesExamples}`;
    }

    // Include template structure context if available
    let templateContext = '';
    if (template?.folderTree) {
      const topLevelFolders = template.folderTree.children
        ? template.folderTree.children.map((child) => child.name).join(', ')
        : '';
      if (topLevelFolders) {
        templateContext = `\n\nTemplate structure (top-level): ${topLevelFolders}`;
      }
    }

    // Create prompt for LLM
    const systemPrompt = `You are a file organization assistant. Your job is to route files to the most appropriate folder based on their filename and path.

Rules:
1. Analyze the filename and source path to determine the file's purpose
2. Choose the most specific and appropriate folder from the available options
3. If unsure, default to "Other"
4. Provide your response as valid JSON with this structure:
   {
     "targetPath": "exact folder path from the list",
     "confidence": 0.0-1.0 (how confident you are in this routing),
     "reasoning": "brief explanation of why this file belongs here"
   }
5. The targetPath must match exactly one of the available paths (case-sensitive)
6. Confidence should be high (0.7-1.0) if the file clearly belongs, medium (0.4-0.6) if somewhat uncertain, low (0.1-0.3) if very uncertain`;

    const userPrompt = `File to route:
Filename: "${fileName}"
Source path: "${sourcePath}"

Available folder paths:
${folderList}${routingRulesContext}${templateContext}

Provide your routing decision as JSON.`;

    logInfo('Calling OpenAI for file routing', {
      fileName,
      sourcePath,
      availablePathsCount: availablePaths.length,
    });

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Using cost-effective model
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent, logical routing
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logWarn('Failed to parse OpenAI JSON response', {
        fileName,
        content,
        error: parseError instanceof Error ? parseError.message : String(parseError),
      });
      return {
        targetPath: otherPath,
        confidence: 0.2,
        reasoning: 'Failed to parse LLM response',
      };
    }

    // Validate and extract result
    const targetPath = parsed.targetPath;
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5;
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : 'LLM routing decision';

    // Validate that targetPath exists in availablePaths
    const validPath = availablePaths.includes(targetPath) ? targetPath : otherPath;

    if (validPath !== targetPath) {
      logWarn('LLM returned invalid target path, using Other', {
        fileName,
        returnedPath: targetPath,
        availablePaths,
      });
    }

    logInfo('OpenAI routing completed', {
      fileName,
      targetPath: validPath,
      confidence,
    });

    return {
      targetPath: validPath,
      confidence,
      reasoning,
    };
  } catch (error) {
    logError('OpenAI routing failed', {
      fileName,
      sourcePath,
      error: error instanceof Error ? error.message : String(error),
    });

    // Fallback to Other on any error
    const otherPath = availablePaths.find((path) => path.toLowerCase().includes('other')) || 'Other';
    return {
      targetPath: otherPath,
      confidence: 0.1,
      reasoning: `LLM routing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate LLM router output JSON
 */
export function validateLLMOutput(output: unknown): boolean {
  if (typeof output !== 'object' || output === null) {
    return false;
  }

  const obj = output as Record<string, unknown>;

  if (typeof obj.targetPath !== 'string') {
    return false;
  }

  if (typeof obj.confidence !== 'number' || obj.confidence < 0 || obj.confidence > 1) {
    return false;
  }

  return true;
}

