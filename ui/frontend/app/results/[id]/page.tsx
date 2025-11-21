'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { testResultsAPI, testExecutionAPI } from '@/lib/api';
import { TestRun, TestResult } from '@/lib/types';
import { ArrowLeft, Download } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatDuration } from '@/lib/utils';

export default function ResultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;
  const [run, setRun] = useState<TestRun | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const maxPolls = 30; // Poll for max 1 minute (30 * 2 seconds)

  useEffect(() => {
    if (runId) {
      loadRunDetails(true); // Initial load
    }
    
    // Cleanup: stop polling when component unmounts
    return () => {
      setPollCount(maxPolls); // Stop polling on unmount
    };
  }, [runId]);

  const loadRunDetails = async (isInitialLoad = false) => {
    // Only show loading spinner on initial load, not during polling
    if (isInitialLoad) {
      setLoading(true);
    }
    try {
      // Try to load completed run first
      try {
        const [runResponse, resultsResponse] = await Promise.all([
          testResultsAPI.getRunById(runId),
          testResultsAPI.getResultsByRun(runId),
        ]);
        setRun(runResponse.data.run);  // Access nested 'run' property
        
        // Transform results to match expected format
        const transformedResults = resultsResponse.data.results.map((result: any) => ({
          id: result.test_case_id,
          test_case_id: result.test_case_id,
          test_case_name: result.test_case_id, // Use ID as name if name not available
          run_id: result.run_id,
          status: result.status,
          passed: result.passed,
          actual_output: result.actual_output,
          expected_output: result.expected_output,
          input: result.metadata?.evaluation?.result?.test_case?.input || '',
          execution_time: result.duration_ms / 1000, // Convert ms to seconds
          metrics: result.metrics.map((m: any) => ({
            metric: m.name,
            name: m.name,
            score: m.score,
            threshold: m.threshold,
            passed: m.passed,
            reason: m.reason
          })),
          error: result.error,
          timestamp: result.timestamp,
          metadata: result.metadata
        }));
        setResults(transformedResults);
      } catch (error: any) {
        // If run not found in results (404), check if it's still running
        if (error.response?.status === 404) {
          console.log('Run not in results yet, checking execution status...');
          const statusResponse = await testExecutionAPI.getRunStatus(runId);
          const statusData = statusResponse.data;
          
          // Check if backend provided actual_run_id (redirect case)
          if (statusData.actual_run_id && statusData.actual_run_id !== runId) {
            console.log('Redirecting to actual run_id:', statusData.actual_run_id);
            router.push(`/results/${statusData.actual_run_id}`);
            return;
          }
          
          // Create a temporary run object for running tests
          setRun({
            id: runId,
            suite_name: statusData.suite || 'Unknown',
            status: statusData.status || 'running',
            start_time: new Date().toISOString(),
            total_tests: statusData.total_tests || 0,
            passed: statusData.passed || 0,
            failed: statusData.failed || 0,
            errors: statusData.errors || 0,
            skipped: 0
          });
          setResults([]);
          
          // Only poll if still running and under max poll count
          if (statusData.status === 'running' && pollCount < maxPolls) {
            setIsPolling(true);
            setPollCount(prev => prev + 1);
            setTimeout(() => loadRunDetails(false), 2000); // Poll without loading spinner
          } else if (pollCount >= maxPolls) {
            console.warn('Max polling attempts reached after', pollCount, 'tries');
            setIsPolling(false);
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to load run details:', error);
      setIsPolling(false);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  const handleExport = async (format: 'json' | 'csv' | 'html') => {
    try {
      const response = await testResultsAPI.exportResults(runId, format);
      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : format === 'csv' ? 'text/csv' : 'text/html' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-run-${runId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export results:', error);
      alert('Failed to export results');
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Run not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative">
          <Link href="/results" className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Results</span>
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">Test Run Details</h1>
                <p className="text-purple-100 font-mono text-sm">{runId}</p>
              </div>
              {isPolling && (
                <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-white hover:bg-white/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-white hover:bg-white/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
              <button
                onClick={() => handleExport('html')}
                className="flex items-center gap-2 rounded-lg bg-white/20 backdrop-blur-sm px-4 py-2 text-white hover:bg-white/30 transition-colors"
              >
                <Download className="h-4 w-4" />
                HTML
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Run Summary */}
      <div className="card card-gradient shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Run Summary</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Suite</div>
              <div className="text-lg font-semibold text-gray-900">{run.suite_name}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
              <div className="mt-1">
                <StatusBadge status={run.status} />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Started</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(run.start_time)}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">Duration</div>
              <div className="text-lg font-semibold text-gray-900">
                {run.end_time ? formatDuration(
                  new Date(run.end_time).getTime() - new Date(run.start_time).getTime()
                ) : '-'}
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Tests</div>
              <div className="text-4xl font-semibold text-gray-900">{run.total_tests}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Passed</div>
              <div className="text-4xl font-semibold bg-gradient-to-br from-emerald-600 to-green-500 bg-clip-text text-transparent">{run.passed || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Failed</div>
              <div className="text-4xl font-semibold bg-gradient-to-br from-rose-600 to-red-500 bg-clip-text text-transparent">{run.failed || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="card shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Test Results ({results.length})</h2>
        </div>
        {isPolling && results.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center bg-gradient-to-br from-purple-50 to-white">
            <div className="relative mb-8">
              <svg className="w-24 h-24 animate-spin" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4" 
                  fill="none"
                  style={{ color: '#a855f7' }}
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  style={{ color: '#7c3aed' }}
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tests Running...</h3>
            <p className="text-lg text-gray-600 mb-6">
              Executing {run.total_tests} test{run.total_tests !== 1 ? 's' : ''} in parallel
            </p>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full border-2 border-purple-300">
              <span className="w-2.5 h-2.5 bg-purple-600 rounded-full animate-pulse"></span>
              <span className="text-sm text-purple-700 font-semibold">Checking for results every 2 seconds</span>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No test results available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {results.map((result) => (
            <div
              key={result.id}
              className="p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent cursor-pointer transition-all"
              onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {result.test_case_name}
                    </h3>
                    <StatusBadge status={result.passed ? 'completed' : 'failed'} />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Duration: {formatDuration(result.execution_time * 1000)}
                  </p>
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${selectedResult?.id === result.id ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {selectedResult?.id === result.id && (
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-6 animate-slide-in">
                  {/* Input/Output */}
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Input</h4>
                      <pre className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                        {result.input}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Expected Output</h4>
                      <pre className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                        {result.expected_output || 'N/A'}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Actual Output</h4>
                      <pre className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 text-xs overflow-x-auto font-mono whitespace-pre-wrap">
                        {result.actual_output}
                      </pre>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Evaluation Metrics</h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {result.metrics.map((metric) => (
                        <div
                          key={metric.metric}
                          className={`rounded-xl border-2 p-4 ${
                            metric.passed 
                              ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50' 
                              : 'border-red-200 bg-gradient-to-br from-red-50 to-rose-50'
                          }`}
                        >
                          <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{metric.metric}</div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-semibold text-gray-900">
                              {metric.score.toFixed(3)}
                            </span>
                            <span className={`badge ${
                              metric.passed ? 'badge-green' : 'badge-red'
                            }`}>
                              {metric.passed ? 'PASS' : 'FAIL'}
                            </span>
                          </div>
                          {metric.reason && (
                            <p className="mt-3 text-xs text-gray-700 leading-relaxed">{metric.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DeepEval Full Response */}
                  {result.metadata?.evaluation && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <h4 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        DeepEval Response
                      </h4>
                      <details className="group">
                        <summary className="cursor-pointer list-none">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                            <svg className="w-4 h-4 text-purple-600 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm font-semibold text-purple-900">View Full Evaluation Details</span>
                          </div>
                        </summary>
                        <pre className="mt-3 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 p-4 text-xs overflow-x-auto font-mono whitespace-pre">
                          {JSON.stringify(result.metadata.evaluation, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Error */}
                  {result.error && (
                    <div>
                      <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-3">Error</h4>
                      <pre className="rounded-xl bg-gradient-to-br from-red-50 to-rose-100 border-2 border-red-200 p-4 text-xs text-red-900 overflow-x-auto font-mono whitespace-pre-wrap">
                        {result.error}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  );
}
