import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  ADMIN_EMAIL,
  adminLoginAllowed,
  isAdminConfigured,
} from "@/lib/admin";

/**
 * NextAuth options — single-operator credentials login for /admin.
 * JWT sessions; nothing sensitive ever reaches the client.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!isAdminConfigured()) return null;
        if (!credentials?.email || !credentials?.password) return null;
        if (!adminLoginAllowed(credentials.email, credentials.password)) {
          return null;
        }
        return { id: "admin", email: ADMIN_EMAIL, name: "Admin" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
