# ---- build (Node 20 + pnpm) ----
FROM node:20-alpine AS build
WORKDIR /app

# pnpm via corepack
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# deps (aproveita cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# código
COPY . .

# variável de build opcional para apontar a API pública
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# build (gera /app/dist)
RUN pnpm build

# ---- serve estático (Caddy) ----
FROM caddy:2-alpine
# Caddyfile com fallback SPA e headers
COPY --from=build /app/dist /usr/share/caddy
COPY <<'CADDY' /etc/caddy/Caddyfile
:80 {
  root * /usr/share/caddy
  encode zstd gzip
  try_files {path} /index.html
  file_server
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "geolocation=(), microphone=(), camera=()"
  }
}
CADDY
