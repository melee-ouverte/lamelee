/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production-ready configuration
  // Note: ESLint and TypeScript warnings should be addressed in development
  // but don't block production builds for deployment flexibility
  
  // Configure allowed image domains for Next.js Image component
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/u/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
