'use client';

import { useEffect, useState } from 'react';
import { testResultsAPI } from '@/lib/api';
import { TestRun } from '@/lib/types';
import { Calendar, Filter } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatDuration } from '@/lib/utils';

export default function ResultsPage() {
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    suite_name: '',
    status: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadRuns();
  }, [filters]);

  const loadRuns = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.suite_name) params.suite_name = filters.suite_name;
      if (filters.status) params.status = filters.status;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await testResultsAPI.listRuns(params);
      setRuns(response.data.runs);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (runId: string, format: 'json' | 'csv' | 'html') => {
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

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
            <Calendar className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-4xl font-bold mb-2">Test Results</h1>
            <p className="text-emerald-100 text-lg">Browse execution history and analyze performance metrics</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-xl">
        <div className="card-header flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Filter className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Filter Results</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="input-label">
                Suite Name
              </label>
              <input
                type="text"
                value={filters.suite_name}
                onChange={(e) => setFilters({ ...filters, suite_name: e.target.value })}
                placeholder="Filter by suite..."
                className="input"
              />
            </div>
            <div>
              <label className="input-label">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="select"
              >
                <option value="">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="running">Running</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="input-label">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="input-label">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card shadow-xl">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-900">Test Runs ({runs.length})</h2>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-teal-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <Calendar className="relative w-20 h-20 text-teal-400 mx-auto animate-float" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Test Runs Found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or run a test suite to see results here.</p>
              <Link href="/execute" className="btn btn-primary">
                Execute Tests
              </Link>
            </div>
          ) : (
            <table className="table-modern">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Run ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Results
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {runs.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-gray-900">
                      {run.id.substring(0, 8)}...
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {run.suite_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(run.start_time)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {run.end_time ? formatDuration(
                        new Date(run.end_time).getTime() - new Date(run.start_time).getTime()
                      ) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <StatusBadge status={run.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-green">{run.passed || 0} passed</span>
                        <span className="badge badge-red">{run.failed || 0} failed</span>
                        <span className="text-xs text-gray-500">/ {run.total_tests} total</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm space-x-3">
                      <Link
                        href={`/results/${run.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-purple-600 hover:text-purple-700"
                      >
                        View
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleExport(run.id, 'json')}
                        className="font-semibold text-gray-600 hover:text-gray-800"
                      >
                        Export
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
