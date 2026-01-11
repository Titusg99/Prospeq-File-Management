/**
 * Company Folder Picker Component
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export interface CompanyFolderPickerProps {
  onFolderSelected: (folderId: string, companyName: string) => void;
  onCancel?: () => void;
}

export function CompanyFolderPicker({ onFolderSelected, onCancel }: CompanyFolderPickerProps) {
  const [folderUrl, setFolderUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const extractFolderIdFromUrl = (url: string): string | null => {
    // Google Drive folder URL patterns:
    // https://drive.google.com/drive/folders/FOLDER_ID
    // https://drive.google.com/drive/u/0/folders/FOLDER_ID
    const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleUrlChange = (value: string) => {
    setFolderUrl(value);
    const extractedId = extractFolderIdFromUrl(value);
    if (extractedId) {
      setFolderId(extractedId);
    }
  };

  const handleFolderIdChange = (value: string) => {
    setFolderId(value);
    setFolderUrl('');
  };

  const handleNext = () => {
    if (folderId && companyName) {
      onFolderSelected(folderId, companyName);
    }
  };

  return (
    <Card title="Select Company Folder">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Enter the Google Drive folder URL or folder ID for the company folder you want to organize.
        </p>

        <Input
          label="Company Name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g., Acme Corp"
          required
        />

        <div>
          <Input
            label="Folder URL (optional)"
            value={folderUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/..."
          />
          <p className="text-xs text-gray-500 mt-1">Or enter folder ID directly below</p>
        </div>

        <Input
          label="Folder ID"
          value={folderId}
          onChange={(e) => handleFolderIdChange(e.target.value)}
          placeholder="1ABC..."
          required
        />

        <div className="flex justify-end gap-2 pt-4">
          {onCancel && (
            <Button variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!folderId || !companyName || isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Next'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

