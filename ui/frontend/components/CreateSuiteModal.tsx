'use client';

import { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import { testArtifactsAPI } from '@/lib/api';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  Input,
  Textarea,
  Select,
  Label,
  FormHint,
  Button,
  Alert,
} from '@/components/ui';

interface CreateSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSuiteModal({ isOpen, onClose, onSuccess }: CreateSuiteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: 'dev-team',
    version: '1.0',
    tags: '',
    default_adapter: 'mock',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const availableAdapters = [
    { type: 'mock', description: 'Mock responses' },
    { type: 'http', description: 'HTTP/REST API calls' },
    { type: 'playwright', description: 'Browser automation' },
    { type: 'python_function', description: 'Python function calls' },
    { type: 'langchain', description: 'LangChain integration' },
    { type: 'shell', description: 'Shell commands' },
    { type: 'websocket', description: 'WebSocket communication' },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        owner: 'dev-team',
        version: '1.0',
        tags: '',
        default_adapter: 'mock',
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name) {
        setError('Suite name is required');
        setSaving(false);
        return;
      }

      const createData: any = {
        name: formData.name,
        description: formData.description,
        owner: formData.owner,
        version: formData.version,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      };

      // Only add default_adapter if provided
      if (formData.default_adapter) {
        createData.default_adapter = {
          type: formData.default_adapter,
          config: {}
        };
      }

      await testArtifactsAPI.createSuite(createData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create test suite');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-purple-100 p-2">
            <FolderPlus className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <ModalTitle>Create New Test Suite</ModalTitle>
            <ModalDescription>Define a new test suite with metadata and default settings</ModalDescription>
          </div>
        </div>
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}
          
          {success && (
            <Alert variant="success">Test suite created successfully!</Alert>
          )}

          {/* Suite Name */}
          <div>
            <Label htmlFor="suite-name">
              Suite Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="suite-name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., API Integration Tests"
            />
            <FormHint>
              This will be used as the suite identifier. Filename will be auto-generated.
            </FormHint>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the purpose of this test suite..."
            />
            <FormHint>A brief description of what this test suite covers</FormHint>
          </div>

          {/* Owner & Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                placeholder="dev-team"
              />
            </div>

            <div>
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="1.0"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">
              Tags <span className="text-gray-400 font-normal">(comma-separated)</span>
            </Label>
            <Input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="integration, api, smoke"
            />
            <FormHint>Organize and filter suites with tags</FormHint>
          </div>

          {/* Default Adapter */}
          <div>
            <Label htmlFor="default-adapter">
              Default Adapter <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Select
              id="default-adapter"
              value={formData.default_adapter}
              onChange={(e) => setFormData({ ...formData, default_adapter: e.target.value })}
            >
              <option value="">No default adapter</option>
              {availableAdapters.map((adapter) => (
                <option key={adapter.type} value={adapter.type}>
                  {adapter.type} - {adapter.description}
                </option>
              ))}
            </Select>
            <FormHint>
              Test cases in this suite will use this adapter by default unless overridden.
            </FormHint>
          </div>

          {/* Info Box */}
          <Alert variant="info">
            <p>
              <strong>Note:</strong> The suite will be created as an empty YAML file. 
              You can add test cases to it after creation using the "New Test Case" button.
            </p>
          </Alert>
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving && <span className="spinner mr-2" />}
          {saving ? 'Creating...' : 'Create Suite'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
