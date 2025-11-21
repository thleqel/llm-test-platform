'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AdapterConfigExamples from './AdapterConfigExamples';
import MetricSelector from './MetricSelector';
import { testArtifactsAPI } from '@/lib/api';
import { DEFAULT_METRICS } from '@/lib/metrics';
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

interface CreateTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultSuite?: string;
}

export default function CreateTestCaseModal({ isOpen, onClose, onSuccess, defaultSuite }: CreateTestCaseModalProps) {
  const [suites, setSuites] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    suite: defaultSuite || '',
    name: '',
    input: '',
    expected_output: '',
    context: '',
    tags: '',
    adapterType: 'mock',
    adapterConfig: JSON.stringify({ actual_output: "Expected response" }, null, 2),
  });
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(DEFAULT_METRICS);
  const [thresholds, setThresholds] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      loadSuites();
      setFormData({
        suite: defaultSuite || '',
        name: '',
        input: '',
        expected_output: '',
        context: '',
        tags: '',
        adapterType: 'mock',
        adapterConfig: JSON.stringify({ actual_output: "Expected response" }, null, 2),
      });
      setSelectedMetrics(DEFAULT_METRICS);
      // Initialize default thresholds for default metrics
      const defaultThresholds: Record<string, number> = {};
      DEFAULT_METRICS.forEach(metric => {
        defaultThresholds[metric] = 0.7;
      });
      setThresholds(defaultThresholds);
      setError('');
      setSuccess(false);
    }
  }, [isOpen, defaultSuite]);

  const loadSuites = async () => {
    try {
      const response = await testArtifactsAPI.listSuites();
      const suiteNames = response.data.suites.map((s: any) => s.name);
      setSuites(suiteNames);
      if (!formData.suite && suiteNames.length > 0) {
        setFormData(prev => ({ ...prev, suite: suiteNames[0] }));
      }
    } catch (error) {
      console.error('Failed to load suites:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.suite) {
        setError('Please select a suite');
        setSaving(false);
        return;
      }

      if (!formData.name || !formData.input || !formData.expected_output) {
        setError('Name, input, and expected output are required');
        setSaving(false);
        return;
      }

      // Validate thresholds for all selected metrics
      if (selectedMetrics.length > 0) {
        const missingThresholds = selectedMetrics.filter(metric => thresholds[metric] === undefined);
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

      // Parse context if it's JSON
      let contextValue = undefined;
      if (formData.context.trim()) {
        try {
          contextValue = JSON.parse(formData.context);
        } catch {
          // Keep as string if not valid JSON
          contextValue = formData.context;
        }
      }

      // Parse adapter config
      let adapterConfigValue = {};
      try {
        adapterConfigValue = JSON.parse(formData.adapterConfig);
      } catch {
        setError('Invalid JSON in adapter configuration');
        setSaving(false);
        return;
      }

      const createData: any = {
        suite: formData.suite,
        name: formData.name,
        input: formData.input,
        expected_output: formData.expected_output,
        metrics: selectedMetrics,
        thresholds: thresholds,
        tags: formData.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t),
        adapter: {
          type: formData.adapterType,
          config: adapterConfigValue,
        },
      };

      if (contextValue !== undefined) {
        createData.context = contextValue;
      }

      await testArtifactsAPI.createTestCase(createData);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create test case');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal open={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <ModalTitle>Create New Test Case</ModalTitle>
        <ModalDescription>Define a new test case with metrics and thresholds</ModalDescription>
      </ModalHeader>

      <ModalBody>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="error">{error}</Alert>
          )}
          
          {success && (
            <Alert variant="success">Test case created successfully!</Alert>
          )}

          {/* Suite Selection */}
          <div>
            <Label htmlFor="suite">
              Test Suite <span className="text-red-500">*</span>
            </Label>
            <Select
              id="suite"
              required
              value={formData.suite}
              onChange={(e) => setFormData({ ...formData, suite: e.target.value })}
            >
              <option value="">Select a suite...</option>
              {suites.map((suite) => (
                <option key={suite} value={suite}>
                  {suite}
                </option>
              ))}
            </Select>
            <FormHint>Choose which test suite this case belongs to</FormHint>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">
              Test Case Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Test basic query response"
            />
            <FormHint>A descriptive name for this test case</FormHint>
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
              placeholder="What is the capital of France?"
            />
            <FormHint>The input/question for the LLM to evaluate</FormHint>
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
              placeholder="Paris"
            />
            <FormHint>The expected/correct answer to compare against</FormHint>
          </div>

          {/* Context */}
          <div>
            <Label htmlFor="context">
              Context <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="context"
              className="font-mono text-sm"
              rows={3}
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              placeholder='{"key": "value"} or plain text'
            />
            <FormHint>Additional context as JSON or plain text</FormHint>
          </div>

          {/* Metrics */}
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
              placeholder="smoke, regression, api"
            />
            <FormHint>Organize tests with tags for filtering</FormHint>
          </div>

          {/* Trigger Section */}
          <div className="border-t-2 border-gray-100 pt-8 mt-8">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700 text-sm font-bold">
                  ⚡
                </span>
                Trigger Configuration
              </h3>
              <p className="mt-1 text-sm text-gray-600">Configure how the test will be executed</p>
            </div>
            
            {/* Trigger Adapter Type */}
            <div className="mb-4">
              <Label htmlFor="adapter-type">
                Trigger Adapter Type <span className="text-red-500">*</span>
              </Label>
              <Select
                id="adapter-type"
                value={formData.adapterType}
                onChange={(e) => setFormData({ ...formData, adapterType: e.target.value })}
              >
                {availableAdapters.map((adapter) => (
                  <option key={adapter.type} value={adapter.type}>
                    {adapter.type} - {adapter.description}
                  </option>
                ))}
              </Select>
              <FormHint>Choose how to trigger and execute this test case</FormHint>
            </div>

            {/* Trigger Config */}
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
          </div>

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
          {saving ? 'Creating...' : 'Create Test Case'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
