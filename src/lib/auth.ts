import { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { prisma } from './db';

/**
 * NextAuth.js Configuration
 *
 * This configuration sets up authentication for the AI Coding Assistant Experience Platform
 * using GitHub OAuth as the sole authentication provider.
 *
 * Features:
 * - GitHub OAuth authentication
 * - JWT-based session strategy for stateless authentication
 * - Custom callbacks for session and JWT token management
 * - Automatic user profile synchronization with GitHub
 *
 * Environment Variables Required:
 * - GITHUB_CLIENT_ID: GitHub OAuth App Client ID
 * - GITHUB_CLIENT_SECRET: GitHub OAuth App Client Secret
 * - NEXTAUTH_URL: Base URL of the application
 * - NEXTAUTH_SECRET: Secret for signing tokens
 */

export const authOptions: NextAuthOptions = {
  // Configure authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,

      // Request additional GitHub profile information
      profile(profile) {
        return {
          id: profile.id.toString(),
          githubId: profile.id,
          username: profile.login,
          email: profile.email,
          avatarUrl: profile.avatar_url,
          bio: profile.bio || null,
        };
      },
    }),
  ],

  // Configure session strategy
  session: {
    // Use JWT for stateless sessions (better for serverless environments)
    strategy: 'jwt',

    // Session expiration time (30 days)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Custom pages
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },

  // Callbacks for customizing authentication flow
  callbacks: {
    /**
     * JWT Callback
     *
     * This callback is called whenever a JWT is created or updated.
     * We use it to add custom fields to the token and manage user data.
     *
     * @param token - The JWT token
     * @param user - User object (only available on sign in)
     * @param account - Account object (only available on sign in)
     * @param profile - OAuth profile (only available on sign in)
     */
    async jwt({ token, user, account, profile }) {
      // On initial sign in with GitHub
      if (account && account.provider === 'github' && profile) {
        try {
          // Cast profile to GitHub profile type
          const githubProfile = profile as any;
          
          // Check if user exists in database
          const existingUser = await prisma.user.findUnique({
            where: { githubId: githubProfile.id.toString() },
          });

          let dbUser;
          if (existingUser) {
            // Update existing user
            dbUser = await prisma.user.update({
              where: { githubId: githubProfile.id.toString() },
              data: {
                username: githubProfile.login,
                email: githubProfile.email,
                avatarUrl: githubProfile.avatar_url,
                bio: githubProfile.bio || null,
                updatedAt: new Date(),
              },
            });
          } else {
            // Create new user
            dbUser = await prisma.user.create({
              data: {
                githubId: githubProfile.id.toString(),
                githubUsername: githubProfile.login,
                username: githubProfile.login,
                email: githubProfile.email,
                avatarUrl: githubProfile.avatar_url,
                bio: githubProfile.bio || null,
              },
            });
          }

          // Add user data to token
          token.id = dbUser.id.toString();
          token.githubId = parseInt(dbUser.githubId);
          token.username = dbUser.username;
          token.avatarUrl = dbUser.avatarUrl;
          token.bio = dbUser.bio;
        } catch (error) {
          console.error('Error managing user in database:', error);
        }
      }

      return token;
    },

    /**
     * Session Callback
     *
     * This callback is called whenever a session is checked.
     * We use it to add custom fields from the JWT to the session object.
     *
     * @param session - The session object
     * @param token - The JWT token
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.githubId = token.githubId as number;
        session.user.username = token.username as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.bio = token.bio as string | null;
      }

      return session;
    },

    /**
     * Sign In Callback
     *
     * Controls whether a user is allowed to sign in.
     * Can be used for additional validation or restrictions.
     *
     * @param user - User attempting to sign in
     * @param account - Account information
     */
    async signIn({ user: _user, account: _account }) {
      // Allow all GitHub users to sign in
      // Additional restrictions can be added here if needed
      return true;
    },
  },

  // Additional NextAuth configuration
  debug: process.env.NODE_ENV === 'development',

  // Secret for signing tokens (required in production)
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Type augmentation for NextAuth
 *
 * This extends the default NextAuth types to include our custom fields.
 * Import this module in your TypeScript configuration to get proper type checking.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      githubId: number;
      username: string;
      email?: string | null;
      avatarUrl: string;
      bio?: string | null;
    };
  }

  interface User {
    id: string;
    githubId: number;
    username: string;
    email?: string | null;
    avatarUrl: string;
    bio?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    githubId: number;
    username: string;
    avatarUrl: string;
    bio?: string | null;
  }
}
