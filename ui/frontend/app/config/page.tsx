'use client';

import { useEffect, useState } from 'react';
import { configAPI } from '@/lib/api';
import { Config } from '@/lib/types';
import { Save, RefreshCw } from 'lucide-react';

export default function ConfigPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await configAPI.getConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      await configAPI.updateConfig(config);
      alert('Configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save config:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset to default configuration?')) return;

    try {
      const response = await configAPI.resetConfig();
      setConfig(response.data);
      alert('Configuration reset to defaults');
    } catch (error) {
      console.error('Failed to reset config:', error);
      alert('Failed to reset configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading configuration...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">No configuration available</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Configuration</h1>
            <p className="text-orange-100 text-lg">Manage platform settings and execution preferences</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-white hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-white text-orange-600 px-4 py-2 font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* DeepEval Service */}
      <div className="card card-gradient shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">DeepEval Service</h2>
        </div>
        <div className="card-body space-y-4">
          <div>
            <label className="input-label">
              Service URL
            </label>
            <input
              type="text"
              value={config.deepeval_service_url}
              onChange={(e) => setConfig({ ...config, deepeval_service_url: e.target.value })}
              className="input"
              placeholder="http://localhost:8001"
            />
            <p className="mt-2 text-sm text-gray-500">
              URL of the DeepEval evaluation service
            </p>
          </div>
        </div>
      </div>

      {/* Test Execution */}
      <div className="card card-gradient shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Test Execution</h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label className="input-label">
              Max Concurrency
            </label>
            <input
              type="number"
              value={config.max_concurrency}
              onChange={(e) => setConfig({ ...config, max_concurrency: parseInt(e.target.value) })}
              className="input"
              min={1}
              max={100}
            />
            <p className="mt-2 text-sm text-gray-500">
              Maximum number of tests to run in parallel
            </p>
          </div>

          <div>
            <label className="input-label">
              Request Timeout (seconds)
            </label>
            <input
              type="number"
              value={config.timeout}
              onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
              className="input"
              min={1}
              max={300}
            />
            <p className="mt-2 text-sm text-gray-500">
              Timeout for individual test executions
            </p>
          </div>

          <div>
            <label className="input-label">
              Max Retries
            </label>
            <input
              type="number"
              value={config.max_retries}
              onChange={(e) => setConfig({ ...config, max_retries: parseInt(e.target.value) })}
              className="input"
              min={0}
              max={10}
            />
            <p className="mt-2 text-sm text-gray-500">
              Number of retry attempts for failed tests
            </p>
          </div>
        </div>
      </div>

      {/* Storage */}
      <div className="card card-gradient shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Storage</h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label className="input-label">
              Test Artifacts Directory
            </label>
            <input
              type="text"
              value={config.test_artifacts_dir}
              onChange={(e) => setConfig({ ...config, test_artifacts_dir: e.target.value })}
              className="input"
              placeholder="./test_artifacts"
            />
            <p className="mt-2 text-sm text-gray-500">
              Directory for version-controlled test cases and suites
            </p>
          </div>

          <div>
            <label className="input-label">
              Test Results Directory
            </label>
            <input
              type="text"
              value={config.test_results_dir}
              onChange={(e) => setConfig({ ...config, test_results_dir: e.target.value })}
              className="input"
              placeholder="./test_results"
            />
            <p className="mt-2 text-sm text-gray-500">
              Directory for storing test execution results (not version controlled)
            </p>
          </div>
        </div>
      </div>

      {/* Playwright */}
      <div className="card card-gradient shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Playwright Configuration</h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.playwright_headless}
                onChange={(e) => setConfig({ ...config, playwright_headless: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Run in Headless Mode</span>
                <p className="text-sm text-gray-500">
                  Run browser automation without visible UI
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={config.playwright_screenshot}
                onChange={(e) => setConfig({ ...config, playwright_screenshot: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Capture Screenshots</span>
                <p className="text-sm text-gray-500">
                  Automatically capture screenshots during UI tests
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
