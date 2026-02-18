import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad"

import { db } from "~/server/db";
import type { Role } from "generated/prisma";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: { role: true }
        })
        session.user.role = dbUser?.role || 'EMPLOYEE'
      }
      return session
    },
  },
} satisfies NextAuthConfig;
