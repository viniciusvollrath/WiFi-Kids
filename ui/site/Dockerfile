# -------- build --------
FROM node:20-alpine AS build
WORKDIR /app

# Copia tudo (evita falha se não existir lockfile)
COPY . .

# Se houver package.json, faz build; senão, trata como site estático
RUN if [ -f package.json ]; then \
      echo "Build de projeto JS"; \
      if [ -f pnpm-lock.yaml ]; then \
        echo "Usando pnpm"; \
        corepack enable && corepack prepare pnpm@latest --activate && \
        pnpm install --frozen-lockfile && pnpm build; \
      elif [ -f package-lock.json ]; then \
        echo "Usando npm"; \
        npm ci && npm run build; \
      elif [ -f yarn.lock ]; then \
        echo "Usando yarn"; \
        corepack enable && corepack prepare yarn@stable --activate && \
        yarn install --frozen-lockfile && yarn build; \
      else \
        echo "Sem lockfile; usando npm"; \
        npm install && npm run build; \
      fi; \
    else \
      echo "Sem package.json; copiando conteúdo para dist/"; \
      mkdir -p /app/dist && cp -r . /app/dist/; \
    fi

# -------- serve estático --------
FROM caddy:2-alpine
COPY --from=build /app/dist /usr/share/caddy
# SPA fallback seguro; para site estático simples também funciona
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
