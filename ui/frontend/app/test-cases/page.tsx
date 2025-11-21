'use client';

import { useEffect, useState } from 'react';
import { testArtifactsAPI } from '@/lib/api';
import { TestSuite, TestCase } from '@/lib/types';
import { FileText, Tag, Upload, Plus, FolderPlus } from 'lucide-react';
import Link from 'next/link';
import CreateTestCaseModal from '@/components/CreateTestCaseModal';
import CreateSuiteModal from '@/components/CreateSuiteModal';

export default function TestCasesPage() {
  const [suites, setSuites] = useState<TestSuite[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateSuiteModalOpen, setIsCreateSuiteModalOpen] = useState(false);

  useEffect(() => {
    loadSuites();
  }, []);

  useEffect(() => {
    if (selectedSuite) {
      loadTestCases(selectedSuite);
    } else {
      loadAllTestCases();
    }
  }, [selectedSuite]);

  const loadSuites = async () => {
    try {
      const response = await testArtifactsAPI.listSuites();
      setSuites(response.data.suites);
    } catch (error) {
      console.error('Failed to load suites:', error);
    }
  };

  const loadAllTestCases = async () => {
    try {
      const response = await testArtifactsAPI.listTestCases();
      setTestCases(response.data.test_cases);
    } catch (error) {
      console.error('Failed to load test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async (suiteName: string) => {
    setLoading(true);
    try {
      const response = await testArtifactsAPI.listTestCases({ suite_name: suiteName });
      setTestCases(response.data.test_cases);
    } catch (error) {
      console.error('Failed to load test cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    // Reload test cases after creation
    if (selectedSuite) {
      loadTestCases(selectedSuite);
    } else {
      loadAllTestCases();
    }
  };

  const handleCreateSuiteSuccess = () => {
    // Reload suites and test cases after suite creation
    loadSuites();
    loadAllTestCases();
  };

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
              <FileText className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Test Cases</h1>
              <p className="text-blue-100 text-lg">Manage and organize your comprehensive test suite</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreateSuiteModalOpen(true)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <FolderPlus className="h-5 w-5" />
              New Suite
            </button>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary flex items-center gap-2 bg-white text-purple-600 hover:bg-gray-50"
            >
              <Plus className="h-5 w-5" />
              New Test Case
            </button>
            <button className="btn btn-secondary flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Suite
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-semibold text-gray-700">Filter by Suite:</label>
        <select
          value={selectedSuite}
          onChange={(e) => setSelectedSuite(e.target.value)}
          className="select flex-1 max-w-xs"
        >
          <option value="">All Suites</option>
          {suites.map((suite) => (
            <option key={suite.name} value={suite.name}>
              {suite.name} ({suite.test_count} tests)
            </option>
          ))}
        </select>
        <div className="text-sm text-gray-500">
          {testCases.length} test case{testCases.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Test Cases Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="h-5 bg-gray-200 rounded flex-1"></div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                <div className="h-6 bg-gray-200 rounded-full w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : testCases.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-blue-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <FileText className="relative w-20 h-20 text-blue-400 mx-auto animate-float" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Test Cases Yet</h3>
            <p className="text-gray-500 mb-6">Create your first test case to start building your test suite.</p>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="btn btn-primary"
            >
              <Plus className="h-5 w-5" />
              Create Test Case
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testCases.map((testCase) => (
            <Link
              key={testCase.id}
              href={`/test-cases/${testCase.id}`}
              className="card-hover group p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{testCase.name}</h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {testCase.input}
              </p>

              {/* Metrics & Thresholds Preview */}
              {testCase.metrics && testCase.metrics.length > 0 && (
                <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
                  <div className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-2">Evaluation Metrics</div>
                  <div className="space-y-1.5">
                    {testCase.metrics.slice(0, 2).map((metric) => {
                      const threshold = testCase.thresholds?.[metric];
                      return (
                        <div key={metric} className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700">{metric}</span>
                          {threshold !== undefined ? (
                            <span className="font-semibold text-purple-600">≥ {(threshold * 100).toFixed(0)}%</span>
                          ) : (
                            <span className="text-gray-400 italic">No threshold</span>
                          )}
                        </div>
                      );
                    })}
                    {testCase.metrics.length > 2 && (
                      <div className="text-xs text-purple-600 font-medium">
                        +{testCase.metrics.length - 2} more metric{testCase.metrics.length - 2 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {testCase.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="badge badge-blue"
                  >
                    <Tag className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
                {testCase.tags.length > 3 && (
                  <span className="badge badge-gray">
                    +{testCase.tags.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-500">{testCase.suite}</span>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600">
                  View Details
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Test Case Modal */}
      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        defaultSuite={selectedSuite}
      />

      {/* Create Suite Modal */}
      <CreateSuiteModal
        isOpen={isCreateSuiteModalOpen}
        onClose={() => setIsCreateSuiteModalOpen(false)}
        onSuccess={handleCreateSuiteSuccess}
      />
    </div>
  );
}
