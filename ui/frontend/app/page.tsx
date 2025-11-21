'use client';

import { useEffect, useState } from 'react';
import { testResultsAPI } from '@/lib/api';
import { StatsOverview } from '@/lib/types';
import StatCard from '@/components/StatCard';
import { FileText, CheckCircle, XCircle, Clock, Play } from 'lucide-react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await testResultsAPI.getStatsOverview();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-300 to-gray-400 p-8 h-40 animate-pulse">
          <div className="h-8 bg-white/30 rounded w-1/3 mb-3"></div>
          <div className="h-5 bg-white/20 rounded w-1/2"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="card animate-pulse">
          <div className="card-header">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-2xl opacity-50 animate-pulse"></div>
            <svg className="relative w-24 h-24 text-purple-400 mx-auto animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Test Data Yet</h3>
          <p className="text-gray-500 mb-6">Start by running your first test suite to see analytics and insights here.</p>
          <Link href="/execute" className="btn btn-primary">
            <Play className="h-5 w-5" />
            Run Your First Test
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        <div className="relative">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-purple-100 text-lg">Monitor your LLM test performance and track quality metrics</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Runs"
          value={stats.total_runs}
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title="Total Tests"
          value={stats.total_tests}
          icon={<FileText className="h-6 w-6" />}
        />
        <StatCard
          title="Passed"
          value={stats.total_passed}
          subtitle={`${stats.pass_rate.toFixed(1)}% pass rate`}
          icon={<CheckCircle className="h-6 w-6" />}
        />
        <StatCard
          title="Failed"
          value={stats.total_failed}
          icon={<XCircle className="h-6 w-6" />}
        />
      </div>

      {/* Recent Runs */}
      <div className="card shadow-xl">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Recent Test Runs</h2>
              <p className="text-sm text-gray-500">Latest execution history</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Suite</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Results</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent_runs.map((run) => (
                <tr key={run.id}>
                  <td className="font-mono text-sm">
                    {run.id.substring(0, 8)}...
                  </td>
                  <td className="font-medium">{run.suite_name}</td>
                  <td className="text-gray-500">{formatDate(run.start_time)}</td>
                  <td>
                    <StatusBadge status={run.status} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green">{run.passed} passed</span>
                      <span className="badge badge-red">{run.failed} failed</span>
                      <span className="text-gray-500 text-sm">/ {run.total_tests} total</span>
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/results/${run.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
