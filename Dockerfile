# Dependencies stage
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm with age policy
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY package.json pnpm-workspace.yaml* ./
RUN pnpm install --no-frozen-lockfile

# Builder stage: Static Export for GitHub Pages / Nginx
FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.18.0 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Production static runner stage using lightweight Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html

# Configure Nginx to listen on port 3000 with SPA fallback
RUN printf 'server {\n\
    listen 3000;\n\
    location / {\n\
        root /usr/share/nginx/html;\n\
        index index.html;\n\
        try_files $uri $uri.html $uri/ /index.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
