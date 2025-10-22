/**
 * T064-T065: GitHub Integration Testing Page
 *
 * Test page for GitHub OAuth and URL preview functionality
 */

import { GetServerSideProps } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../lib/auth';
import Layout from '../components/Layout';
import GitHubIntegrationTester from '../components/GitHubIntegrationTester';

export default function GitHubTestPage() {
  return (
    <Layout>
      <GitHubIntegrationTester />
    </Layout>
  );
}

// Require authentication to access this page
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

  return {
    props: {},
  };
};
