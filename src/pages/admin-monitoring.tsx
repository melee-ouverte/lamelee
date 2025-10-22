/**
 * T066-T068: Admin Monitoring Dashboard Page
 *
 * Admin page for viewing system monitoring data and testing middleware
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import Layout from '../components/Layout';
import AdminMonitoringDashboard from '../components/AdminMonitoringDashboard';

export default function AdminMonitoringPage() {
  return (
    <Layout>
      <AdminMonitoringDashboard />
    </Layout>
  );
}

// Require admin authentication to access this page
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false,
      },
    };
  }

  // Simple admin check
  const isAdmin =
    session.user.email?.endsWith('@admin.com') ||
    session.user.username?.toLowerCase().includes('admin');

  if (!isAdmin) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
