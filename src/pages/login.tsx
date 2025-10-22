import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession, signIn, getProviders } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { Github, Code, Users, Star, ArrowRight } from 'lucide-react';

interface LoginProps {
  providers: any;
  callbackUrl?: string;
}

export default function Login({ providers, callbackUrl }: LoginProps) {
  const router = useRouter();
  const { error } = router.query;

  const handleSignIn = () => {
    signIn('github', { callbackUrl: callbackUrl || '/' });
  };

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from GitHub.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account.';
      case 'EmailCreateAccount':
        return 'Could not create email account.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'Another account with the same email address already exists.';
      case 'EmailSignin':
        return 'Check your email inbox for the sign-in link.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details provided.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <Layout>
      <Head>
        <title>Sign In - AI Coding Assistant Experience Platform</title>
        <meta name="description" content="Sign in to share and discover AI coding assistant experiences" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="flex items-center space-x-2 text-3xl font-bold text-gray-900">
                  <Code className="h-8 w-8 text-blue-600" />
                  <span>AI Coding Assistant Experience Platform</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to the Community
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Join thousands of developers sharing their AI coding assistant experiences, 
                prompts, and insights to help the community grow.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Features */}
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Code className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Share Your Experiences
                      </h3>
                      <p className="text-gray-600">
                        Document and share your AI coding assistant experiences, including 
                        the prompts that worked, the context, and the results achieved.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Learn from Others
                      </h3>
                      <p className="text-gray-600">
                        Discover proven prompts and techniques from the community. 
                        Filter by AI assistant type, programming language, and use case.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Star className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Rate and Review
                      </h3>
                      <p className="text-gray-600">
                        Help the community by rating prompts, leaving helpful comments, 
                        and reacting to experiences that resonate with you.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Join the Growing Community
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">1,000+</div>
                      <div className="text-sm text-gray-600">Experiences</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">500+</div>
                      <div className="text-sm text-gray-600">Developers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">2,500+</div>
                      <div className="text-sm text-gray-600">Prompts</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sign In Form */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Sign In to Get Started
                  </h2>
                  <p className="text-gray-600">
                    Connect with your GitHub account to start sharing and discovering experiences.
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 border border-red-200 rounded-md bg-red-50">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Authentication Error
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          {getErrorMessage(error as string)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* GitHub Sign In Button */}
                <button
                  onClick={handleSignIn}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  <Github className="h-5 w-5 mr-3" />
                  Continue with GitHub
                </button>

                {/* Why GitHub */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 mb-4">
                    Why do we use GitHub?
                  </p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Secure authentication with your existing GitHub account</p>
                    <p>• Automatically sync your profile and avatar</p>
                    <p>• Connect your coding experiences with your repositories</p>
                    <p>• Build credibility within the developer community</p>
                  </div>
                </div>

                {/* Next Steps */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    After signing in, you can:
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Share your first AI coding experience</span>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Browse and filter community experiences</span>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Rate prompts and leave helpful comments</span>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 mr-2 text-gray-400" />
                      <span>Build your developer profile and reputation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-12">
              <p className="text-sm text-gray-500">
                By signing in, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  // If user is already signed in, redirect to home
  if (session) {
    return {
      redirect: {
        destination: context.query.callbackUrl as string || '/',
        permanent: false,
      },
    };
  }

  const providers = await getProviders();
  
  return {
    props: {
      providers,
      callbackUrl: context.query.callbackUrl as string || null,
    },
  };
};