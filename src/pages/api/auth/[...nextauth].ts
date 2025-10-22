/**
 * NextAuth.js API Route
 *
 * This dynamic API route handles all authentication requests
 * including sign in, sign out, callbacks, and session management.
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

export default NextAuth(authOptions);
