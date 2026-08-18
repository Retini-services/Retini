FROM oven/bun:latest AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .

RUN node node_modules/.bin/vite build


FROM oven/bun:slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package.json ./
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["bun", "./build/index.js"]