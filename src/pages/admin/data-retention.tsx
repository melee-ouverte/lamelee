/**
 * T069-T070: Data Retention Management Interface
 *
 * Admin interface for managing data retention policies and monitoring cleanup operations.
 */

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';

interface RetentionStats {
  totalRecords: number;
  activeRecords: number;
  softDeletedRecords: number;
  recordsEligibleForCleanup: number;
  breakdown: {
    [key: string]: {
      total: number;
      active: number;
      softDeleted: number;
      eligibleForCleanup: number;
    };
  };
}

interface CleanupResult {
  type: string;
  processed: number;
  archived: number;
  deleted: number;
  errors: number;
  duration: number;
}

interface RetentionPolicy {
  maxAge: number;
  gracePeriod: number;
  enableArchiving: boolean;
  batchSize: number;
}

interface RetentionPolicies {
  experiences: RetentionPolicy;
  users: RetentionPolicy;
  comments: RetentionPolicy;
  prompts: RetentionPolicy;
}

export default function DataRetentionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<RetentionStats | null>(null);
  const [policies, setPolicies] = useState<RetentionPolicies | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<CleanupResult[] | null>(
    null
  );
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin =
    session?.user?.email?.endsWith('@admin.com') ||
    session?.user?.username?.toLowerCase().includes('admin');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchData();
  }, [session, status, isAdmin, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, policiesResponse] = await Promise.all([
        fetch('/api/admin/data-retention?action=get_stats'),
        fetch('/api/admin/data-retention?action=get_policies'),
      ]);

      if (!statsResponse.ok || !policiesResponse.ok) {
        throw new Error('Failed to fetch data retention information');
      }

      const statsData = await statsResponse.json();
      const policiesData = await policiesResponse.json();

      if (statsData.success) {
        setStats(statsData.data);
      }

      if (policiesData.success) {
        setPolicies(policiesData.data.defaultPolicies);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async (
    type: 'full' | 'experiences' | 'users' | 'orphaned',
    dryRun = false
  ) => {
    try {
      setCleanupLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-retention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'run_cleanup',
          cleanupType: type,
          dryRun,
        }),
      });

      if (!response.ok) {
        throw new Error('Cleanup operation failed');
      }

      const data = await response.json();

      if (data.success) {
        setCleanupResults(Array.isArray(data.data) ? data.data : [data.data]);
        setLastCleanup(new Date().toLocaleString());

        // Refresh stats after cleanup
        if (!dryRun) {
          await fetchData();
        }
      } else {
        throw new Error(data.error?.message || 'Cleanup failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cleanup operation failed');
    } finally {
      setCleanupLoading(false);
    }
  };

  const testCleanup = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/data-retention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'test_cleanup',
        }),
      });

      if (!response.ok) {
        throw new Error('Test cleanup failed');
      }

      const data = await response.json();

      if (data.success) {
        setStats(data.data.currentStats);
        alert('Test completed! Check the current statistics below.');
      } else {
        throw new Error(data.error?.message || 'Test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Retention Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage data retention policies and cleanup operations.
          </p>
          {lastCleanup && (
            <p className="text-sm text-green-600 mt-2">
              Last cleanup: {lastCleanup}
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Statistics */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Current Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalRecords.toLocaleString()}
                </div>
                <div className="text-sm text-blue-800">Total Records</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.activeRecords.toLocaleString()}
                </div>
                <div className="text-sm text-green-800">Active Records</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.softDeletedRecords.toLocaleString()}
                </div>
                <div className="text-sm text-yellow-800">Soft Deleted</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">
                  {stats.recordsEligibleForCleanup.toLocaleString()}
                </div>
                <div className="text-sm text-red-800">Eligible for Cleanup</div>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Soft Deleted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cleanup Eligible
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(stats.breakdown).map(([type, data]) => (
                    <tr key={type}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.total.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {data.active.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                        {data.softDeleted.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {data.eligibleForCleanup.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Retention Policies */}
        {policies && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Current Retention Policies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(policies).map(([type, policy]) => (
                <div key={type} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 capitalize mb-2">
                    {type}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Max Age:{' '}
                      <span className="font-medium">{policy.maxAge} days</span>
                    </div>
                    <div>
                      Grace Period:{' '}
                      <span className="font-medium">
                        {policy.gracePeriod} days
                      </span>
                    </div>
                    <div>
                      Archiving:{' '}
                      <span className="font-medium">
                        {policy.enableArchiving ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div>
                      Batch Size:{' '}
                      <span className="font-medium">{policy.batchSize}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cleanup Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Cleanup Operations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <button
              onClick={testCleanup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {loading ? 'Testing...' : 'Test Cleanup'}
            </button>

            <button
              onClick={() => runCleanup('full', true)}
              disabled={cleanupLoading}
              className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {cleanupLoading ? 'Running...' : 'Dry Run (Full)'}
            </button>

            <button
              onClick={() => runCleanup('full', false)}
              disabled={cleanupLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {cleanupLoading ? 'Running...' : 'Run Full Cleanup'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => runCleanup('experiences', false)}
              disabled={cleanupLoading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cleanup Experiences
            </button>

            <button
              onClick={() => runCleanup('users', false)}
              disabled={cleanupLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cleanup Users
            </button>

            <button
              onClick={() => runCleanup('orphaned', false)}
              disabled={cleanupLoading}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cleanup Orphaned
            </button>
          </div>
        </div>

        {/* Cleanup Results */}
        {cleanupResults && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Latest Cleanup Results
            </h2>
            <div className="space-y-4">
              {cleanupResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-gray-900 capitalize">
                      {result.type}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {result.duration}ms
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Processed:</span>
                      <span className="font-medium ml-1">
                        {result.processed}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Archived:</span>
                      <span className="font-medium ml-1 text-blue-600">
                        {result.archived}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Deleted:</span>
                      <span className="font-medium ml-1 text-red-600">
                        {result.deleted}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Errors:</span>
                      <span className="font-medium ml-1 text-red-600">
                        {result.errors}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
