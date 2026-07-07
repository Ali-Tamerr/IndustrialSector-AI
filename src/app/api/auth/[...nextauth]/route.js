import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      try {
        // Query database to see if this admin email exists
        const res = await pool.query("SELECT id FROM admin_accounts WHERE email = $1", [user.email]);
        if (res.rows.length > 0) {
          user.adminId = res.rows[0].id;
          return true;
        }
        
        // Auto-provision a new admin account in the database for Google sign-in
        const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
        const newAdminId = `ADM-${randomHex}`;
        await pool.query(
          "INSERT INTO admin_accounts (id, email, password) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING",
          [newAdminId, user.email, "google-oauth-managed"]
        );
        user.adminId = newAdminId;
        return true;
      } catch (err) {
        console.error("NextAuth signIn database check failed:", err);
        return false;
      }
    },
    async jwt({ token, user }) {
      // Pass the admin ID from user to token
      if (user) {
        token.adminId = user.adminId;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass the admin ID to the session object
      if (session.user) {
        session.user.id = token.sub;
        session.user.adminId = token.adminId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
