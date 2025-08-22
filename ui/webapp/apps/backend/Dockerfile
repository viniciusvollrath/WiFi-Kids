
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./
RUN npm i -g pnpm && pnpm i || true
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build || npx tsc -p tsconfig.json
EXPOSE 3001
CMD ["pnpm","dev"]
