'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { testArtifactsAPI, testExecutionAPI } from '@/lib/api';
import { TestSuite, TestCase } from '@/lib/types';
import { Play, CheckCircle, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import PlaywrightStepBuilder, { PlaywrightConfig } from '@/components/PlaywrightStepBuilder';

export default function ExecutePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [showTestCases, setShowTestCases] = useState(false);
  const [maxConcurrency, setMaxConcurrency] = useState(10);
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<string>('');
  const [healthStatus, setHealthStatus] = useState<boolean | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedTestForConfig, setSelectedTestForConfig] = useState<TestCase | null>(null);
  const [playwrightConfig, setPlaywrightConfig] = useState<PlaywrightConfig>({
    browser: 'chromium',
    headless: true,
    base_url: '',
    steps: [],
    screenshot_on_error: true,
  });

  useEffect(() => {
    loadSuites();
    checkHealth();
  }, []);

  // Handle pre-selection from query parameters
  useEffect(() => {
    const suite = searchParams.get('suite');
    const testId = searchParams.get('test');
    
    if (suite && suites.length > 0) {
      setSelectedSuite(suite);
      loadTestCasesWithPreselection(suite, testId);
    }
  }, [searchParams, suites]);

  const loadSuites = async () => {
    try {
      const response = await testArtifactsAPI.listSuites();
      setSuites(response.data.suites);
    } catch (error) {
      console.error('Failed to load suites:', error);
    }
  };

  const loadTestCases = async (suiteName: string) => {
    try {
      const response = await testArtifactsAPI.listTestCases({ suite_name: suiteName });
      setTestCases(response.data.test_cases || []);
      // By default, select all test cases
      setSelectedTestIds(response.data.test_cases?.map((tc: TestCase) => tc.id) || []);
      setShowTestCases(true);
    } catch (error) {
      console.error('Failed to load test cases:', error);
      setTestCases([]);
      setSelectedTestIds([]);
    }
  };

  const loadTestCasesWithPreselection = async (suiteName: string, testId: string | null) => {
    try {
      const response = await testArtifactsAPI.listTestCases({ suite_name: suiteName });
      const cases = response.data.test_cases || [];
      setTestCases(cases);
      
      // If a specific test ID is provided, select only that test
      // Otherwise, select all tests
      if (testId) {
        setSelectedTestIds([testId]);
      } else {
        setSelectedTestIds(cases.map((tc: TestCase) => tc.id));
      }
      setShowTestCases(true);
    } catch (error) {
      console.error('Failed to load test cases:', error);
      setTestCases([]);
      setSelectedTestIds([]);
    }
  };

  const handleSuiteChange = (suiteName: string) => {
    setSelectedSuite(suiteName);
    setRunId(''); // Clear previous run ID
    if (suiteName) {
      loadTestCases(suiteName);
    } else {
      setTestCases([]);
      setSelectedTestIds([]);
      setShowTestCases(false);
    }
  };

  const toggleTestCase = (testId: string) => {
    setSelectedTestIds(prev => 
      prev.includes(testId) 
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    );
  };

  const toggleAllTestCases = () => {
    if (selectedTestIds.length === testCases.length) {
      setSelectedTestIds([]);
    } else {
      setSelectedTestIds(testCases.map(tc => tc.id));
    }
  };

  const checkHealth = async () => {
    try {
      const response = await testExecutionAPI.checkDeepEvalHealth();
      setHealthStatus(response.data.healthy);
    } catch (error) {
      setHealthStatus(false);
    }
  };

  const handleRun = async () => {
    if (!selectedSuite || selectedTestIds.length === 0) return;

    setRunning(true);
    try {
      const response = await testExecutionAPI.runTests({
        suite_name: selectedSuite,
        test_ids: selectedTestIds,
        max_concurrency: maxConcurrency,
      });
      const runId = response.data.run_id;
      setRunId(runId);
      // Redirect to results page automatically
      router.push(`/results/${runId}`);
    } catch (error) {
      console.error('Failed to start test run:', error);
      alert('Failed to start test run');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Play className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Execute Tests</h1>
            <p className="text-purple-100 text-lg">Run comprehensive test suites and monitor real-time execution</p>
          </div>
        </div>
      </div>

      {/* Service Health */}
      <div className={`card ${healthStatus ? 'border-green-300 bg-gradient-to-r from-green-50 to-white' : healthStatus === false ? 'border-red-300 bg-gradient-to-r from-red-50 to-white' : ''}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-3 ${healthStatus ? 'bg-green-100 text-green-600' : healthStatus === false ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Service Status</h2>
              <p className="text-sm text-gray-600">DeepEval evaluation service</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {healthStatus === null ? (
              <div className="flex items-center gap-2">
                <span className="spinner w-4 h-4" />
                <span className="text-gray-500 font-medium">Checking...</span>
              </div>
            ) : healthStatus ? (
              <span className="badge badge-green">
                <CheckCircle className="h-4 w-4" />
                Healthy
              </span>
            ) : (
              <span className="badge badge-red">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Offline
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Execution Form */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Run Configuration</h2>
          </div>
        </div>
        
        <div className="card-body space-y-6">
          <div>
            <label className="input-label">
              Select Test Suite
            </label>
            <select
              value={selectedSuite}
              onChange={(e) => handleSuiteChange(e.target.value)}
              className="select"
              disabled={running}
            >
              <option value="">Choose a suite...</option>
              {suites.map((suite) => (
                <option key={suite.name} value={suite.name}>
                  {suite.name} ({suite.test_count} tests)
                </option>
              ))}
            </select>
            <p className="input-hint">Choose the test suite you want to execute</p>
          </div>

          {/* Test Cases Selection */}
          {testCases.length > 0 && (
            <div className="border-2 border-purple-200 rounded-xl overflow-hidden bg-gradient-to-br from-purple-50 via-white to-purple-50 shadow-lg">
              <button
                onClick={() => setShowTestCases(!showTestCases)}
                className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Select Test Cases</p>
                    <p className="text-sm text-purple-100 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span className="text-white font-bold">{selectedTestIds.length}</span> 
                        <span>of {testCases.length} selected</span>
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {showTestCases ? (
                    <ChevronUp className="h-6 w-6" />
                  ) : (
                    <ChevronDown className="h-6 w-6" />
                  )}
                </div>
              </button>

              {showTestCases && (
                <div className="p-5 space-y-3 max-h-[500px] overflow-y-auto bg-gradient-to-b from-white to-purple-50/20">
                  {/* Select All - Visually Distinct Control */}
                  <div className="mb-3 pb-3 border-b-2 border-dashed border-purple-200">
                    <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-all cursor-pointer bg-purple-50/40 group">
                      <input
                        type="checkbox"
                        ref={(el) => {
                          if (el) {
                            el.indeterminate = selectedTestIds.length > 0 && selectedTestIds.length < testCases.length;
                          }
                        }}
                        checked={selectedTestIds.length === testCases.length}
                        onChange={toggleAllTestCases}
                        className="w-5 h-5 text-purple-600 rounded-md border-2 border-purple-400 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
                        disabled={running}
                      />
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <p className="font-bold text-purple-900 text-sm">
                            {selectedTestIds.length === testCases.length ? 'Deselect All Tests' : 'Select All Tests'}
                          </p>
                        </div>
                        {selectedTestIds.length > 0 && selectedTestIds.length < testCases.length && (
                          <span className="text-xs font-bold text-purple-600 bg-white px-3 py-1.5 rounded-full shadow-sm">
                            {selectedTestIds.length} / {testCases.length}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Individual Test Cases */}
                  {testCases.map((testCase) => {
                    const isSelected = selectedTestIds.includes(testCase.id);
                    const hasPlaywrightAdapter = testCase.adapter?.type === 'playwright';
                    return (
                      <div
                        key={testCase.id}
                        className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border-2 ${
                          isSelected 
                            ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-400 shadow-md ring-2 ring-purple-200 ring-offset-2' 
                            : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        <label className="flex items-start gap-4 flex-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleTestCase(testCase.id)}
                            className="mt-1 w-5 h-5 text-purple-600 rounded-md border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer"
                            disabled={running}
                          />
                          <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`font-mono text-xs font-extrabold px-3 py-1.5 rounded-md border-2 ${
                              isSelected 
                                ? 'bg-slate-900 text-white border-slate-700 shadow-md' 
                                : 'bg-slate-100 text-slate-900 border-slate-300 group-hover:bg-slate-200 group-hover:border-slate-400'
                            } transition-all`}>
                              {testCase.id}
                            </span>
                            {testCase.name && (
                              <>
                                <span className="text-gray-300">•</span>
                                <p className={`text-sm font-medium truncate ${
                                  isSelected ? 'text-purple-900' : 'text-gray-700 group-hover:text-purple-700'
                                } transition-colors`}>
                                  {testCase.name}
                                </p>
                              </>
                            )}
                          </div>
                          <p className={`text-xs mb-3 line-clamp-2 leading-relaxed ${
                            isSelected ? 'text-gray-700 font-medium' : 'text-gray-500'
                          }`}>
                            {testCase.input.substring(0, 120)}
                            {testCase.input.length > 120 && '...'}
                          </p>
                          {testCase.metrics && testCase.metrics.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {testCase.metrics.map((metric, idx) => (
                                <span
                                  key={metric}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm'
                                      : 'bg-purple-50 text-purple-700 border border-purple-200 group-hover:bg-purple-100 group-hover:border-purple-300'
                                  }`}
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  {metric}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        </label>
                        
                        {/* Configure Trigger Button */}
                        {hasPlaywrightAdapter && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTestForConfig(testCase);
                              if (testCase.adapter?.config) {
                                setPlaywrightConfig({
                                  browser: testCase.adapter.config.browser || 'chromium',
                                  headless: testCase.adapter.config.headless !== false,
                                  base_url: testCase.adapter.config.base_url || '',
                                  steps: testCase.adapter.config.steps || [],
                                  screenshot_on_error: testCase.adapter.config.screenshot_on_error !== false,
                                });
                              }
                              setShowConfigModal(true);
                            }}
                            disabled={running}
                            className="mt-1 p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                            title="Configure Playwright Steps"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="input-label">
              Max Concurrency
            </label>
            <input
              type="number"
              value={maxConcurrency}
              onChange={(e) => setMaxConcurrency(parseInt(e.target.value))}
              className="input"
              min={1}
              max={50}
              disabled={running}
            />
            <p className="input-hint">
              Number of tests to run in parallel (1-50). Higher values speed up execution but use more resources.
            </p>
          </div>

          <button
            onClick={handleRun}
            disabled={!selectedSuite || selectedTestIds.length === 0 || running || !healthStatus}
            className="btn btn-primary btn-lg w-full"
          >
            {running ? (
              <>
                <span className="spinner" />
                Running {selectedTestIds.length} Test{selectedTestIds.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>
                <Play className="h-5 w-5" />
                Run {selectedTestIds.length > 0 ? `${selectedTestIds.length} Selected Test${selectedTestIds.length !== 1 ? 's' : ''}` : 'Tests'}
              </>
            )}
          </button>

          {selectedSuite && selectedTestIds.length === 0 && (
            <div className="alert alert-warning">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-700">
                Please select at least one test case to run
              </p>
            </div>
          )}

          {runId && (
            <div className="alert alert-success animate-slide-in-down">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 animate-pulse-subtle" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-green-700 font-medium">
                  Test run started successfully!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Run ID: <code className="font-mono bg-green-100 px-2 py-0.5 rounded">{runId}</code>
                </p>
                <a
                  href={`/results/${runId}`}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  View Results
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Playwright Configuration Modal */}
      {showConfigModal && selectedTestForConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Configure Playwright Test</h2>
                  <p className="text-purple-100 mt-1">
                    Visual step builder for <span className="font-mono bg-white/20 px-2 py-0.5 rounded">{selectedTestForConfig.id}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    setSelectedTestForConfig(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6">
              <PlaywrightStepBuilder
                config={playwrightConfig}
                onChange={setPlaywrightConfig}
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t-2 border-gray-200 bg-gray-50 p-6 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowConfigModal(false);
                  setSelectedTestForConfig(null);
                }}
                className="px-6 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update the test case with the new configuration
                  const updatedTestCases = testCases.map(tc => {
                    if (tc.id === selectedTestForConfig.id) {
                      return {
                        ...tc,
                        adapter: {
                          type: 'playwright',
                          config: playwrightConfig
                        }
                      };
                    }
                    return tc;
                  });
                  setTestCases(updatedTestCases);
                  setShowConfigModal(false);
                  setSelectedTestForConfig(null);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
