'use client';

import { useState, useEffect } from 'react';
import { TestCase } from '@/lib/types';
import { X } from 'lucide-react';
import AdapterConfigExamples from './AdapterConfigExamples';
import MetricSelector from './MetricSelector';
import PlaywrightStepBuilder, { PlaywrightConfig } from './PlaywrightStepBuilder';
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

interface EditTestCaseModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function EditTestCaseModal({ testCase, isOpen, onClose, onSave }: EditTestCaseModalProps) {
  const [formData, setFormData] = useState({
    name: testCase.name,
    input: testCase.input,
    expected_output: testCase.expected_output,
    context: typeof testCase.context === 'string' ? testCase.context : JSON.stringify(testCase.context || {}, null, 2),
    tags: testCase.tags.join(', '),
    adapterType: testCase.adapter?.type || 'mock',
    adapterConfig: JSON.stringify(testCase.adapter?.config || {}, null, 2),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(testCase.metrics || []);
  const [thresholds, setThresholds] = useState<Record<string, number>>(testCase.thresholds || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [playwrightConfig, setPlaywrightConfig] = useState<PlaywrightConfig>({
    browser: 'chromium',
    headless: true,
    base_url: '',
    steps: [],
    screenshot_on_error: true,
  });
  const [useVisualBuilder, setUseVisualBuilder] = useState(false);
  
  const availableAdapters = [
    { type: 'http', description: 'HTTP/REST API calls' },
    { type: 'playwright', description: 'Browser automation' },
    { type: 'python_function', description: 'Python function calls' },
    { type: 'langchain', description: 'LangChain integration' },
    { type: 'mock', description: 'Mock responses' },
    { type: 'shell', description: 'Shell commands' },
    { type: 'websocket', description: 'WebSocket communication' },
  ];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: testCase.name,
        input: testCase.input,
        expected_output: testCase.expected_output,
        context: typeof testCase.context === 'string' ? testCase.context : JSON.stringify(testCase.context || {}, null, 2),
        tags: testCase.tags.join(', '),
        adapterType: testCase.adapter?.type || 'mock',
        adapterConfig: JSON.stringify(testCase.adapter?.config || {}, null, 2),
      });
      setSelectedMetrics(testCase.metrics || []);
      
      // Initialize thresholds - ensure all selected metrics have thresholds
      const initialThresholds: Record<string, number> = { ...(testCase.thresholds || {}) };
      (testCase.metrics || []).forEach(metric => {
        if (initialThresholds[metric] === undefined) {
          initialThresholds[metric] = 0.7; // Default threshold
        }
      });
      setThresholds(initialThresholds);
      
      // Initialize Playwright config if it's a Playwright adapter
      if (testCase.adapter?.type === 'playwright' && testCase.adapter?.config) {
        setPlaywrightConfig({
          browser: testCase.adapter.config.browser || 'chromium',
          headless: testCase.adapter.config.headless !== false,
          base_url: testCase.adapter.config.base_url || '',
          steps: testCase.adapter.config.steps || [],
          screenshot_on_error: testCase.adapter.config.screenshot_on_error !== false,
        });
        setUseVisualBuilder(true);
      } else {
        setUseVisualBuilder(false);
      }
      
      setError('');
      setSuccess(false);
    }
  }, [isOpen, testCase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Parse adapter config
      let adapterConfig = {};
      
      // Use visual builder config for Playwright if enabled
      if (formData.adapterType === 'playwright' && useVisualBuilder) {
        adapterConfig = playwrightConfig;
      } else {
        try {
          adapterConfig = JSON.parse(formData.adapterConfig);
        } catch {
          setError('Invalid JSON in adapter configuration');
          setSaving(false);
          return;
        }
      }

      // Parse context
      let context: string | Record<string, unknown> = formData.context;
      try {
        const parsedContext = JSON.parse(formData.context);
        if (typeof parsedContext === 'object' && parsedContext !== null) {
          context = parsedContext;
        }
      } catch {
        // Keep as string if not valid JSON
      }

      // Validate thresholds for all selected metrics
      if (selectedMetrics.length > 0) {
        const missingThresholds = selectedMetrics.filter(metric => 
          thresholds[metric] === undefined || thresholds[metric] === null
        );
        if (missingThresholds.length > 0) {
          setError(`Please set thresholds for all selected metrics: ${missingThresholds.join(', ')}`);
          setSaving(false);
          return;
        }

        // Validate threshold values are between 0 and 1
        const invalidThresholds = selectedMetrics.filter(metric => {
          const value = thresholds[metric];
          return value < 0 || value > 1 || isNaN(value);
        });
        if (invalidThresholds.length > 0) {
          setError('All thresholds must be between 0 and 1');
          setSaving(false);
          return;
        }
      }

      const updateData = {
        name: formData.name,
        input: formData.input,
        expected_output: formData.expected_output,
        context,
        metrics: selectedMetrics,
        thresholds: thresholds,
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
        adapter: {
          type: formData.adapterType,
          config: adapterConfig,
        },
      };

      console.log('Saving test case with data:', updateData);
      await onSave(updateData);
      console.log('Save completed successfully');
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500); // Increased from 1000ms to 1500ms to ensure reload completes
    } catch (err) {
      console.error('Failed to save test case:', err);
      setError(err instanceof Error ? err.message : 'Failed to save test case');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Edit Test Case</ModalTitle>
        <ModalDescription>Update test configuration and evaluation criteria</ModalDescription>
      </ModalHeader>

          {/* Form */}
      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}

          {success && (
            <Alert variant="success">Test case updated successfully!</Alert>
          )}            {/* Name */}
          <div>
            <Label htmlFor="name">
              Test Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormHint>A descriptive name that identifies this test case</FormHint>
          </div>

          {/* Input */}
          <div>
            <Label htmlFor="input">
              Input <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="input"
              required
              className="font-mono text-sm"
              rows={4}
              value={formData.input}
              onChange={(e) => setFormData({ ...formData, input: e.target.value })}
            />
            <FormHint>The input that will be sent to your LLM or system under test</FormHint>
          </div>

            {/* Expected Output */}
            <div>
              <Label htmlFor="expected_output">
                Expected Output <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="expected_output"
                required
                className="font-mono text-sm"
                rows={4}
                value={formData.expected_output}
                onChange={(e) => setFormData({ ...formData, expected_output: e.target.value })}
                placeholder="Enter the expected response or output..."
              />
              <FormHint>The expected response used as reference for evaluation metrics</FormHint>
            </div>

            {/* Context */}
            <div>
              <Label htmlFor="context">
                Context <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="context"
                className="font-mono text-sm"
                rows={4}
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                placeholder='{"key": "value"} or plain text'
              />
              <FormHint>Additional context for evaluation. Can be JSON object or plain text</FormHint>
            </div>

            {/* Metrics & Thresholds */}
            <div>
              <Label>
                Evaluation Metrics & Thresholds <span className="text-red-500">*</span>
              </Label>
              <MetricSelector
                selectedMetrics={selectedMetrics}
                onChange={setSelectedMetrics}
                thresholds={thresholds}
                onThresholdsChange={setThresholds}
              />
              <FormHint>
                Select metrics and set pass thresholds (0-1) for each. Tests pass when all metrics meet their thresholds.
              </FormHint>
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
            />
            <FormHint>Add tags to organize and filter your test cases</FormHint>
          </div>

            {/* Trigger Section */}
            <div className="border-t-2 border-gray-100 pt-6 mt-6">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Trigger Configuration</h3>
              </div>
              
              {/* Trigger Adapter Type */}
              <div className="mb-4">
                <Label htmlFor="adapter-type">
                  Trigger Adapter Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="adapter-type"
                  value={formData.adapterType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData({ ...formData, adapterType: newType });
                    // Enable visual builder for Playwright by default
                    if (newType === 'playwright') {
                      setUseVisualBuilder(true);
                    }
                  }}
                >
                  {availableAdapters.map((adapter) => (
                    <option key={adapter.type} value={adapter.type}>
                      {adapter.type} - {adapter.description}
                    </option>
                  ))}
                </Select>
                <FormHint>Choose how to trigger and execute this test case</FormHint>
              </div>

              {/* Playwright Visual Builder Toggle */}
              {formData.adapterType === 'playwright' && (
                <div className="mb-4 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useVisualBuilder}
                      onChange={(e) => {
                        setUseVisualBuilder(e.target.checked);
                        // Sync JSON when switching to JSON mode
                        if (!e.target.checked) {
                          setFormData({
                            ...formData,
                            adapterConfig: JSON.stringify(playwrightConfig, null, 2)
                          });
                        }
                      }}
                      className="w-5 h-5 text-purple-600 border-2 border-purple-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-purple-900">Use Visual Step Builder</span>
                      <p className="text-xs text-purple-700 mt-1">
                        Build browser automation tests with drag-and-drop interface (recommended)
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Trigger Config - Visual Builder or JSON */}
              {formData.adapterType === 'playwright' && useVisualBuilder ? (
                <div>
                  <PlaywrightStepBuilder
                    config={playwrightConfig}
                    onChange={(newConfig) => {
                      setPlaywrightConfig(newConfig);
                      // Also update the JSON form field for consistency
                      setFormData({
                        ...formData,
                        adapterConfig: JSON.stringify(newConfig, null, 2)
                      });
                    }}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="adapter-config">
                    Trigger Configuration <span className="text-gray-400 font-normal">(JSON)</span>
                  </Label>
                  <Textarea
                    id="adapter-config"
                    className="font-mono text-sm"
                    rows={8}
                    value={formData.adapterConfig}
                    onChange={(e) => setFormData({ ...formData, adapterConfig: e.target.value })}
                    placeholder='{"url": "https://api.example.com", "method": "POST"}'
                  />
                  <AdapterConfigExamples adapterType={formData.adapterType} />
                </div>
              )}
            </div>

            {/* Actions */}
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
            {saving && (
              <span className="spinner mr-2" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>
  );
}
