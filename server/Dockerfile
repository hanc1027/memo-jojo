# Stage 1: Build
FROM node:26.13.0-bookworm-slim AS builder

WORKDIR /app/server

RUN npm install --global pnpm@12.18.0

COPY server/package.json server/pnpm-lock.yaml ./
COPY server/pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY server/ ./

COPY openapi/ /app/openapi/

RUN pnpm build


# Stage 2: Production
FROM node:26.13.0-bookworm-slim AS production

WORKDIR /app/server

RUN npm install --global pnpm@12.18.0

COPY server/package.json server/pnpm-lock.yaml ./
COPY server/pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/openapi/ /app/openapi/

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]