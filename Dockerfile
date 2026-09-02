# syntax=docker/dockerfile:1.7
FROM node:24-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --chown=nextjs:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs --from=builder /app/.next/standalone ./
COPY --chown=nextjs:nodejs --from=builder /app/.next/static ./.next/static
COPY --chown=nextjs:nodejs --from=builder /app/src ./src
COPY --chown=nextjs:nodejs --from=builder /app/scripts ./scripts
COPY --chown=nextjs:nodejs --from=builder /app/drizzle ./drizzle
COPY --chown=nextjs:nodejs --from=builder /app/package.json /app/tsconfig.json ./
RUN mkdir -p /app/data/uploads && chown nextjs:nodejs /app/data /app/data/uploads
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
