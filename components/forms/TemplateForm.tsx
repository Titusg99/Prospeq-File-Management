/**
 * Template form component
 */

'use client';

import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface TemplateFormData {
  name: string;
  folderTree?: any;
  routingRules?: any[];
}

export interface TemplateFormProps {
  onSubmit: (data: TemplateFormData) => Promise<void>;
  initialData?: TemplateFormData;
  submitLabel?: string;
}

export function TemplateForm({ onSubmit, initialData, submitLabel = 'Create Template' }: TemplateFormProps) {
  const [formData, setFormData] = useState<TemplateFormData>(
    initialData || {
      name: '',
      folderTree: null,
      routingRules: [],
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
          label="Template Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <div className="text-sm text-gray-600">
          Template editor UI coming soon. Use the Template Editor page for full functionality.
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}

