/**
 * Template editor page
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageShell } from '@/components/layout/PageShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FolderTreeEditor } from '@/components/template/FolderTreeEditor';
import { ExpectedItemsEditor } from '@/components/template/ExpectedItemsEditor';
import type { Template, ExpectedItem } from '@/types';

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [template, setTemplate] = useState<Template | null>(null);
  const [expectedItems, setExpectedItems] = useState<ExpectedItem[]>([]);
  const [selectedFolderKey, setSelectedFolderKey] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load template
    fetch(`/api/templates/${templateId}`)
      .then((res) => res.json())
      .then((data) => {
        setTemplate(data.template);
      })
      .catch(console.error);

    // Load expected items
    // TODO: Add API endpoint for expected items
  }, [templateId]);

  const handleSave = async () => {
    if (!template) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderTree: template.folderTree,
          routingRules: template.routingRules,
        }),
      });

      if (!response.ok) throw new Error('Save failed');

      alert('Template saved successfully');
      router.push('/templates');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!template) return;

    try {
      const response = await fetch(`/api/templates/${templateId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Publish failed');

      alert('Template published successfully');
      router.refresh();
    } catch (error) {
      console.error('Failed to publish template:', error);
      alert('Failed to publish template');
    }
  };

  if (!template) {
    return (
      <PageShell title="Template Editor" description="Loading...">
        <Card>
          <p className="text-gray-600">Loading template...</p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={`Template Editor: ${template.name}`}
      description={`Status: ${template.status} ${template.status === 'draft' ? '- Click Publish to make it available' : ''}`}
      headerActions={
        <div className="flex gap-2">
          {template.status === 'draft' && (
            <Button variant="secondary" onClick={handlePublish}>
              Publish
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push('/templates')}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <FolderTreeEditor
            tree={template.folderTree}
            onChange={(updatedTree) => setTemplate({ ...template, folderTree: updatedTree })}
          />
        </div>
        <div>
          <ExpectedItemsEditor
            items={expectedItems}
            templateTree={template.folderTree}
            selectedFolderKey={selectedFolderKey}
            onItemsChange={setExpectedItems}
          />
        </div>
      </div>
    </PageShell>
  );
}

