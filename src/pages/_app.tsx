/**
 * Next.js App Component with NextAuth Session Provider
 * 
 * This wraps the entire application with necessary providers
 * including NextAuth for authentication state management.
 */

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}