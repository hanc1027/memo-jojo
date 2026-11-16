# Stage 1: Build React
FROM node:26.13.0-bookworm-slim AS builder

WORKDIR /app/client

RUN npm install --global pnpm@12.18.0

COPY client/package.json client/pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY client/ ./

RUN pnpm build


# Stage 2: Nginx Production
FROM nginx:alpine AS production

COPY client/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]