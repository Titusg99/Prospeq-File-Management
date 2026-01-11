/**
 * Clean Up page
 */

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CompanyFolderPicker } from '@/components/cleanup/CompanyFolderPicker';
import { PlanReviewTable } from '@/components/plan/PlanReviewTable';
import type { PlanItem } from '@/types';

type CleanUpStep = 'select' | 'scanning' | 'planning' | 'review' | 'building' | 'review-clean' | 'promote';

export default function CleanUpPage() {
  const searchParams = useSearchParams();
  const runIdParam = searchParams.get('runId');
  
  const [step, setStep] = useState<CleanUpStep>(runIdParam ? 'review' : 'select');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [scanJobId, setScanJobId] = useState<string | null>(runIdParam);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [templateFolderKeys, setTemplateFolderKeys] = useState<Array<{ key: string; path: string }>>([]);

  const handleFolderSelected = async (folderId: string, name: string) => {
    setSelectedFolderId(folderId);
    setCompanyName(name);
    setStep('scanning');

    try {
      // Start scan job
      const response = await fetch('/api/run/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId,
          companyName: name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Scan failed with status ${response.status}`);
      }

      const { jobId } = await response.json();
      setScanJobId(jobId);

      // Poll for scan completion, then start plan
      // For now, simulate progression
      setTimeout(() => {
        setStep('planning');
        // In real implementation, poll job status
      }, 2000);
    } catch (error) {
      console.error('Failed to start scan:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scan';
      alert(`Failed to start scan: ${errorMessage}`);
      setStep('select');
    }
  };

  const handlePlanReviewComplete = async () => {
    setStep('building');
    // In real implementation, start build job
    setTimeout(() => {
      setStep('review-clean');
    }, 2000);
  };

  const handlePromote = async () => {
    setStep('promote');
    // In real implementation, start promote job
  };

  if (step === 'select') {
    return (
      <PageShell title="Clean Up" description="Select a company folder to organize">
        <CompanyFolderPicker onFolderSelected={handleFolderSelected} />
      </PageShell>
    );
  }

  if (step === 'review' && scanJobId) {
    return (
      <PageShell title="Review Plan" description="Review and approve routing decisions">
        <div className="space-y-4">
          {planItems.length > 0 ? (
            <PlanReviewTable
              planItems={planItems}
              templateFolderKeys={templateFolderKeys}
              onDecisionChange={async (id, decision, finalFolderKey) => {
                // Update plan item decision
                const response = await fetch(`/api/runs/${scanJobId}/review`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    updates: [{ id, decision, finalFolderKey }],
                  }),
                });
                if (response.ok) {
                  const { planItems: updated } = await response.json();
                  setPlanItems(updated);
                }
              }}
              onBulkAction={async (action, ids) => {
                // Handle bulk actions
                const updates = ids?.map((id) => ({
                  id,
                  decision: action === 'exclude-selected' ? 'excluded' as const : 'approved' as const,
                })) || planItems.map((item) => ({
                  id: item.id,
                  decision: action === 'approve-all' || (action === 'approve-high-confidence' && item.confidence >= 0.7) ? 'approved' as const : item.decision,
                }));

                const response = await fetch(`/api/runs/${scanJobId}/review`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ updates }),
                });
                if (response.ok) {
                  const { planItems: updated } = await response.json();
                  setPlanItems(updated);
                }
              }}
            />
          ) : (
            <Card>
              <p className="text-gray-600">Loading plan items...</p>
            </Card>
          )}
          <div className="flex justify-end">
            <Button onClick={handlePlanReviewComplete}>Continue to Build CLEAN</Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Clean Up" description={`Step: ${step}`}>
      <Card>
        <p className="text-gray-600">Workflow step: {step}</p>
        <p className="text-sm text-gray-500 mt-2">Full workflow implementation in progress...</p>
      </Card>
    </PageShell>
  );
}

