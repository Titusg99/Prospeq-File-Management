/**
 * Missing report export utilities
 */

import type { MissingItem } from './missingReport';
import type { DuplicateFlag } from '@/types';
import { getDuplicateFlags } from '@/lib/db/duplicateFlags';

export interface MissingReportExportData {
  companyName: string;
  date: string;
  missingItems: MissingItem[];
  duplicateFlags?: DuplicateFlag[];
}

/**
 * Format missing report as plain text
 */
export function formatMissingReportAsText(data: MissingReportExportData): string {
  const lines: string[] = [];

  lines.push(`MISSING ITEMS REPORT - ${data.companyName} - ${data.date}`);
  lines.push('');
  lines.push('='.repeat(60));
  lines.push('');

  // Essential missing
  const essential = data.missingItems.filter((item) => item.priority === 'Essential' && item.missing);
  if (essential.length > 0) {
    lines.push('ESSENTIAL MISSING:');
    lines.push('');
    for (const item of essential) {
      lines.push(`- [${item.folderPath}]: ${item.name}`);
      lines.push(`  Reason: ${item.reason || 'Evidence not found'}`);
      lines.push(`  Last checked: ${data.date}`);
      lines.push('');
    }
  }

  // Important missing
  const important = data.missingItems.filter((item) => item.priority === 'Important' && item.missing);
  if (important.length > 0) {
    lines.push('IMPORTANT MISSING:');
    lines.push('');
    for (const item of important) {
      lines.push(`- [${item.folderPath}]: ${item.name}`);
      lines.push(`  Reason: ${item.reason || 'Evidence not found'}`);
      lines.push(`  Last checked: ${data.date}`);
      lines.push('');
    }
  }

  // Nice-to-have missing
  const niceToHave = data.missingItems.filter((item) => item.priority === 'Nice-to-have' && item.missing);
  if (niceToHave.length > 0) {
    lines.push('NICE-TO-HAVE MISSING:');
    lines.push('');
    for (const item of niceToHave) {
      lines.push(`- [${item.folderPath}]: ${item.name}`);
      lines.push(`  Reason: ${item.reason || 'Evidence not found'}`);
      lines.push(`  Last checked: ${data.date}`);
      lines.push('');
    }
  }

  // Duplicate flags
  if (data.duplicateFlags && data.duplicateFlags.length > 0) {
    lines.push('='.repeat(60));
    lines.push('');
    lines.push('DUPLICATE FLAGS:');
    lines.push('');
    for (const flag of data.duplicateFlags) {
      lines.push(`- File Group ${flag.groupId}:`);
      lines.push(`  Files: ${flag.fileIds.join(', ')}`);
      lines.push(`  Basis: ${flag.basis}`);
      lines.push(`  Severity: ${flag.severity}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Generate filename for missing report export
 */
export function generateMissingReportFilename(companyName: string, date: Date): string {
  const dateStr = date.toISOString().split('T')[0];
  const safeName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
  return `missing_report_${safeName}_${dateStr}.txt`;
}

