/**
 * T066-T068: Admin Monitoring Dashboard Component
 *
 * Simple React component for viewing system monitoring data,
 * request logs, and testing middleware functionality.
 */

'use client';

import React, { useState, useEffect } from 'react';

interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
  username?: string;
  ip: string;
  error?: string;
}

interface SystemStats {
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  uniqueUsers: number;
  uniqueIPs: number;
  topEndpoints: Record<string, number>;
  topUsers: Record<string, number>;
  errorRates: Record<string, number>;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  environment: string;
  version: string;
  services: Record<string, string>;
}

const AdminMonitoringDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'logs' | 'stats' | 'health' | 'test'
  >('stats');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (
    action: string,
    params: Record<string, any> = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Request failed');
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const data = await fetchData('get_logs', { limit: 50 });
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await fetchData('get_stats', { timeframe: 'day' });
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadHealth = async () => {
    try {
      const data = await fetchData('health_check');
      setHealth(data);
    } catch (err) {
      console.error('Failed to load health:', err);
    }
  };

  const testError = async (errorType: string) => {
    try {
      await fetchData('test_error', { errorType });
    } catch (err) {
      // Expected to fail - this is for testing error handling
      console.log('Error test completed:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'stats') loadStats();
    if (activeTab === 'health') loadHealth();
  }, [activeTab]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (statusCode?: number) => {
    if (!statusCode) return 'text-gray-500';
    if (statusCode >= 500) return 'text-red-600';
    if (statusCode >= 400) return 'text-yellow-600';
    if (statusCode >= 300) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Monitoring Dashboard
        </h1>
        <p className="text-gray-600">
          System monitoring, request logs, and middleware testing
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'stats', label: '📊 Statistics' },
            { key: 'logs', label: '📝 Request Logs' },
            { key: 'health', label: '❤️ Health Check' },
            { key: 'test', label: '🧪 Error Testing' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="text-gray-500">⏳ Loading...</div>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Request Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Requests:</span>
                <span className="font-medium">{stats.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span>Successful:</span>
                <span className="font-medium text-green-600">
                  {stats.successfulRequests}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-medium text-red-600">
                  {stats.errorRequests}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Response:</span>
                <span className="font-medium">
                  {stats.averageResponseTime}ms
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">User Activity</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Unique Users:</span>
                <span className="font-medium">{stats.uniqueUsers}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique IPs:</span>
                <span className="font-medium">{stats.uniqueIPs}</span>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Top Users</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(stats.topUsers)
                  .slice(0, 3)
                  .map(([user, count]) => (
                    <div key={user} className="flex justify-between">
                      <span className="truncate">{user}</span>
                      <span>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Top Endpoints</h3>
            <div className="space-y-2 text-sm">
              {Object.entries(stats.topEndpoints)
                .slice(0, 5)
                .map(([endpoint, count]) => (
                  <div key={endpoint} className="flex justify-between">
                    <span className="truncate text-gray-600">{endpoint}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Request Logs</h3>
            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.url}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getStatusColor(log.statusCode)}>
                        {log.statusCode || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.responseTime ? `${log.responseTime}ms` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.username || 'Anonymous'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Health Tab */}
      {activeTab === 'health' && health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                  {health.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-medium">{health.environment}</span>
              </div>
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="font-medium">{health.version}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="font-medium">
                  {formatUptime(health.uptime)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>RSS:</span>
                <span className="font-medium">
                  {formatBytes(health.memory.rss)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Heap Total:</span>
                <span className="font-medium">
                  {formatBytes(health.memory.heapTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Heap Used:</span>
                <span className="font-medium">
                  {formatBytes(health.memory.heapUsed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>External:</span>
                <span className="font-medium">
                  {formatBytes(health.memory.external)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 md:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Services Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="text-center">
                  <div className="text-sm text-gray-600 capitalize">
                    {service}
                  </div>
                  <div
                    className={`text-xs font-medium mt-1 ${
                      status.includes('connected') ||
                      status.includes('operational') ||
                      status.includes('enabled') ||
                      status.includes('active')
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Error Handling Tests</h3>
          <p className="text-gray-600 mb-6">
            Test different types of errors to verify middleware error handling
            works correctly. Check the browser console and network tab to see
            the responses.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                type: 'validation',
                label: 'Validation Error',
                color: 'bg-yellow-600',
              },
              { type: 'auth', label: 'Auth Error', color: 'bg-red-600' },
              { type: 'server', label: 'Server Error', color: 'bg-purple-600' },
              { type: 'custom', label: 'Custom Error', color: 'bg-blue-600' },
            ].map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => testError(type)}
                disabled={isLoading}
                className={`${color} text-white px-4 py-3 rounded-md hover:opacity-90 disabled:opacity-50 text-sm font-medium`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Open browser DevTools → Network tab to
              see the detailed error responses with proper status codes, error
              structures, and request IDs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringDashboard;
