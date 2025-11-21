import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test Artifacts API
export const testArtifactsAPI = {
  listSuites: () => api.get('/api/artifacts/suites'),
  getSuite: (name: string) => api.get(`/api/artifacts/suites/${name}`),
  createSuite: (data: any) => api.post('/api/artifacts/suites', data),
  listTestCases: (params?: { suite_name?: string; tags?: string }) => 
    api.get('/api/artifacts/test-cases', { params }),
  getTestCase: (id: string) => api.get(`/api/artifacts/test-cases/${id}`),
  createTestCase: (data: any) => api.post('/api/artifacts/test-cases', data),
  updateTestCase: (id: string, data: any) => api.put(`/api/artifacts/test-cases/${id}`, data),
  listAdapters: () => api.get('/api/artifacts/adapters'),
  uploadSuite: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/artifacts/suites/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Test Execution API
export const testExecutionAPI = {
  runTests: (data: { suite_name: string; test_ids?: string[]; max_concurrency?: number }) =>
    api.post('/api/execution/run', data),
  getRunStatus: (runId: string) => api.get(`/api/execution/runs/${runId}/status`),
  listActiveRuns: () => api.get('/api/execution/runs/active'),
  cancelRun: (runId: string) => api.post(`/api/execution/runs/${runId}/cancel`),
  checkDeepEvalHealth: () => api.get('/api/execution/health/deepeval'),
};

// Test Results API
export const testResultsAPI = {
  listRuns: (params?: { suite_name?: string; status?: string; start_date?: string; end_date?: string; limit?: number }) =>
    api.get('/api/results/runs', { params }),
  getRun: (runId: string) => api.get(`/api/results/runs/${runId}`),
  getRunById: (runId: string) => api.get(`/api/results/runs/${runId}`),
  getRunSummary: (runId: string) => api.get(`/api/results/runs/${runId}/summary`),
  getRunResults: (runId: string) => api.get(`/api/results/runs/${runId}/results`),
  getResultsByRun: (runId: string) => api.get(`/api/results/runs/${runId}/results`),
  getTestCaseHistory: (testCaseId: string, limit = 10) =>
    api.get(`/api/results/test-cases/${testCaseId}/history`, { params: { limit } }),
  exportHtml: (runId: string) => api.get(`/api/results/runs/${runId}/export/html`),
  exportJson: (runId: string) => api.get(`/api/results/runs/${runId}/export/json`),
  exportResults: (runId: string, format: 'json' | 'csv' | 'html') =>
    api.get(`/api/results/runs/${runId}/export/${format}`, { responseType: 'blob' }),
  getStatsOverview: () => api.get('/api/results/stats/overview'),
  getStatsBySuite: () => api.get('/api/results/stats/by-suite'),
};

// Configuration API
export const configAPI = {
  getConfig: () => api.get('/api/config/'),
  getConfigValue: (key: string) => api.get(`/api/config/${key}`),
  updateConfig: (config: any) => api.put('/api/config/', config),
  updateConfigValue: (key: string, value: any) => api.put('/api/config/', { key, value }),
  resetConfig: () => api.post('/api/config/reset'),
};

// WebSocket for real-time updates
export const createWebSocket = (runId: string) => {
  const wsUrl = API_BASE_URL.replace('http', 'ws');
  return new WebSocket(`${wsUrl}/ws/test-execution/${runId}`);
};
