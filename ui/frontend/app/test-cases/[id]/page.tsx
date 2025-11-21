'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { testArtifactsAPI, testExecutionAPI } from '@/lib/api';
import { TestCase } from '@/lib/types';
import { ArrowLeft, Tag, Play, Edit } from 'lucide-react';
import Link from 'next/link';
import EditTestCaseModal from '@/components/EditTestCaseModal';
import PlaywrightConfigDisplay from '@/components/PlaywrightConfigDisplay';

export default function TestCaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testCaseId = params.id as string;
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (testCaseId) {
      loadTestCase();
    }
  }, [testCaseId]);

  const loadTestCase = async () => {
    setLoading(true);
    try {
      console.log('Loading test case:', testCaseId);
      const response = await testArtifactsAPI.getTestCase(testCaseId);
      console.log('Test case loaded:', response.data);
      setTestCase(response.data);
    } catch (error) {
      console.error('Failed to load test case:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTestCase = async (updateData: any) => {
    try {
      console.log('Updating test case with:', updateData);
      await testArtifactsAPI.updateTestCase(testCaseId, updateData);
      console.log('Update successful, reloading...');
      await loadTestCase(); // Reload to show updated data
      console.log('Reload complete');
    } catch (error) {
      console.error('Error in handleSaveTestCase:', error);
      throw error; // Re-throw so the modal can show the error
    }
  };

  const handleRunTest = () => {
    if (!testCase || !testCase.suite) {
      alert('Test case suite information is missing');
      return;
    }
    
    // Redirect to execute page with this test case pre-selected
    router.push(`/execute?suite=${encodeURIComponent(testCase.suite)}&test=${encodeURIComponent(testCaseId)}`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading test case...</div>
      </div>
    );
  }

  if (!testCase) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-gray-500 mb-4">Test case not found</div>
        <Link href="/test-cases" className="text-blue-600 hover:text-blue-800">
          ← Back to Test Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative">
          <Link href="/test-cases" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Test Cases</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{testCase.name}</h1>
              <p className="text-blue-100 font-mono text-sm">ID: {testCase.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-white hover:bg-white/30 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button 
                onClick={handleRunTest}
                className="flex items-center gap-2 rounded-lg bg-white text-purple-600 px-4 py-2 font-semibold hover:bg-white/90 transition-colors"
              >
                <Play className="h-4 w-4" />
                Run Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      <div className="card card-gradient shadow-xl">
        <div className="card-body">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Suite */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Test Suite</div>
              <div className="text-lg font-semibold text-gray-900">{testCase.suite || 'N/A'}</div>
            </div>
            
            {/* Trigger */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Trigger Type</div>
              <span className="badge badge-blue text-sm">
                {testCase.adapter?.type || 'N/A'}
              </span>
            </div>

            {/* Metrics */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Evaluation Metrics</div>
              <div className="flex flex-wrap gap-2">
                {testCase.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="badge badge-purple text-xs"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tags Row */}
          {testCase.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {testCase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 badge badge-gray"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metrics & Thresholds */}
      {testCase.metrics && testCase.metrics.length > 0 && (
        <div className="card card-gradient shadow-xl">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Evaluation Metrics & Thresholds
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testCase.metrics.map((metric) => {
                const threshold = testCase.thresholds?.[metric];
                const hasThreshold = threshold !== undefined;
                
                return (
                  <div
                    key={metric}
                    className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{metric}</h3>
                      {hasThreshold ? (
                        <span className="badge badge-green text-xs">Configured</span>
                      ) : (
                        <span className="badge badge-yellow text-xs">No threshold</span>
                      )}
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pass Threshold</div>
                      {hasThreshold ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-semibold bg-gradient-to-br from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            {threshold.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500">/ 1.00</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic">Not set</span>
                      )}
                    </div>
                    {hasThreshold && (
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>Required: ≥ {(threshold * 100).toFixed(0)}%</span>
                          <span className="font-semibold text-purple-600">{(threshold * 100).toFixed(0)}%</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${threshold * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">About Thresholds</p>
                  <p>Each metric must meet or exceed its threshold for the test to pass. Thresholds range from 0 to 1, where 1 represents perfect performance.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Content - Input & Output */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input */}
        <div className="card card-hover shadow-xl">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900">Input</h2>
            <span className="text-xs text-gray-500 font-mono">{testCase.input.length} chars</span>
          </div>
          <div className="card-body">
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 border border-gray-200">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
{testCase.input}
              </pre>
            </div>
          </div>
        </div>

        {/* Expected Output */}
        <div className="card card-hover shadow-xl">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900">Expected Output</h2>
            <span className="text-xs text-gray-500 font-mono">{testCase.expected_output.length} chars</span>
          </div>
          <div className="card-body">
            <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 border-2 border-green-200">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
{testCase.expected_output}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Trigger Configuration - Full Width */}
      {testCase.adapter && (
        <div className="card card-hover shadow-xl">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
              Trigger Configuration
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                {testCase.adapter.type}
              </span>
            </h2>
          </div>
          <div className="card-body">
            {testCase.adapter.type === 'playwright' ? (
              <PlaywrightConfigDisplay config={testCase.adapter.config} />
            ) : (
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 border border-blue-200">
                <pre className="text-xs text-gray-800 overflow-x-auto font-mono">
{JSON.stringify(testCase.adapter.config || {}, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Context Section */}
      {testCase.context && Object.keys(testCase.context).length > 0 && (
        <div className="card card-hover shadow-xl">
          <div className="card-header">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Context
            </h2>
          </div>
          <div className="card-body">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 border border-amber-200">
              <pre className="text-xs text-gray-800 overflow-x-auto font-mono">
{typeof testCase.context === 'string' 
  ? testCase.context 
  : JSON.stringify(testCase.context, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {testCase && (
        <EditTestCaseModal
          testCase={testCase}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTestCase}
        />
      )}
    </div>
  );
}
