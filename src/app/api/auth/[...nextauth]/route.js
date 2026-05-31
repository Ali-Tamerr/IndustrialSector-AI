import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// ---------------------------------------------------------------------------
// Auth configuration – values are read from .env (Next.js loads .env automatically)
// ---------------------------------------------------------------------------
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      // Attach the user id (or email) to the session for later use
      if (token.sub) session.user.id = token.sub;
      return session;
    },
    async jwt({ token, account }) {
      if (account) token.accessToken = account.access_token;
      return token;
    },
  },
};

// NextAuth returns a request handler. We reuse it for both GET and POST.
const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;

