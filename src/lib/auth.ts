import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { env } from "@/env";

export const auth = betterAuth({
  appName: "Pozitif AI – Navori Publisher",
  baseURL: env.APP_URL,
  secret: env.AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  session: {
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 30,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    database: { joins: false },
  },
  trustedOrigins: [env.APP_URL],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 30,
  },
  plugins: [
    admin({
      defaultRole: "viewer",
      adminRoles: ["admin"],
    }),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
