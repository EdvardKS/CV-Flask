# syntax=docker/dockerfile:1.6
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 py3-pip && pip3 install --break-system-packages --no-cache-dir jinja2
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Pre-render legacy Padel templates into /public/padel-legacy/{errores,resumen}.html
RUN cd legacy-src && python3 render_templates.py
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# python3 is needed to run the Padel CLI at runtime
RUN apk add --no-cache python3
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/legacy-src ./legacy-src
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Ensure runtime CSV dir exists and is writable by nextjs user
RUN mkdir -p /app/public/padel-data && chown -R nextjs:nodejs /app/public/padel-data /app/legacy-src
USER nextjs
ENV PADEL_DATA_DIR=/app/public/padel-data
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
