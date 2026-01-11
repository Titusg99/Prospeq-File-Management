/**
 * Ingest page
 */

'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CompanyFolderPicker } from '@/components/cleanup/CompanyFolderPicker';

type IngestStep = 'select-input' | 'select-destination' | 'processing';

export default function IngestPage() {
  const [step, setStep] = useState<IngestStep>('select-input');
  const [inboxFolderId, setInboxFolderId] = useState('');
  const [destinationType, setDestinationType] = useState<'new' | 'existing'>('existing');
  const [destinationFolderId, setDestinationFolderId] = useState('');

  const handleInboxSelected = (folderId: string) => {
    setInboxFolderId(folderId);
    setStep('select-destination');
  };

  const handleDestinationSelected = async () => {
    if (!inboxFolderId) return;
    if (destinationType === 'existing' && !destinationFolderId) {
      alert('Please select a destination folder');
      return;
    }

    setStep('processing');
    // TODO: Start ingest workflow
  };

  if (step === 'select-input') {
    return (
      <PageShell title="Ingest" description="Select inbox folder with files to process">
        <Card title="Select Inbox Folder">
          <div className="space-y-4">
            <p className="text-gray-600">
              Choose an inbox folder containing files you want to route to the correct company folders.
            </p>
            <Input
              label="Inbox Folder ID or URL"
              value={inboxFolderId}
              onChange={(e) => {
                const value = e.target.value;
                // Extract folder ID from URL if provided
                const match = value.match(/\/folders\/([a-zA-Z0-9_-]+)/);
                setInboxFolderId(match ? match[1] : value);
              }}
              placeholder="Enter folder ID or paste Google Drive URL"
            />
            <div className="flex justify-end">
              <Button onClick={() => inboxFolderId && handleInboxSelected(inboxFolderId)}>
                Next
              </Button>
            </div>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (step === 'select-destination') {
    return (
      <PageShell title="Ingest - Select Destination" description="Choose where to route the files">
        <Card title="Destination">
          <div className="space-y-4">
            <Select
              label="Destination Type"
              options={[
                { value: 'existing', label: 'Add to Existing Company' },
                { value: 'new', label: 'Create New Company' },
              ]}
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value as 'new' | 'existing')}
            />

            {destinationType === 'existing' ? (
              <Input
                label="Company Folder ID"
                value={destinationFolderId}
                onChange={(e) => setDestinationFolderId(e.target.value)}
                placeholder="Enter company folder ID"
              />
            ) : (
              <Input
                label="New Company Name"
                value={destinationFolderId}
                onChange={(e) => setDestinationFolderId(e.target.value)}
                placeholder="Enter company name"
              />
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setStep('select-input')}>
                Back
              </Button>
              <Button onClick={handleDestinationSelected}>
                Start Ingest
              </Button>
            </div>
          </div>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell title="Ingest" description="Processing files...">
      <Card>
        <p className="text-gray-600">Ingest workflow processing...</p>
        <p className="text-sm text-gray-500 mt-2">Full ingest workflow implementation in progress...</p>
      </Card>
    </PageShell>
  );
}

