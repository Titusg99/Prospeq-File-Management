/**
 * Workspace form component
 */

'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface WorkspaceFormData {
  name: string;
  driveId?: string;
  folderId?: string;
}

export interface WorkspaceFormProps {
  onSubmit: (data: WorkspaceFormData) => Promise<void>;
  initialData?: WorkspaceFormData;
  submitLabel?: string;
}

export function WorkspaceForm({ onSubmit, initialData, submitLabel = 'Create Workspace' }: WorkspaceFormProps) {
  const [formData, setFormData] = useState<WorkspaceFormData>(
    initialData || {
      name: '',
      driveId: '',
      folderId: '',
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card title={submitLabel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Workspace Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Drive ID (optional)"
          value={formData.driveId || ''}
          onChange={(e) => setFormData({ ...formData, driveId: e.target.value || undefined })}
          placeholder="Leave empty for My Drive"
        />

        <Input
          label="Folder ID (optional)"
          value={formData.folderId || ''}
          onChange={(e) => setFormData({ ...formData, folderId: e.target.value || undefined })}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

