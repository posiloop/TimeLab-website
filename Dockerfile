FROM oven/bun:1.3.6-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# next build runs on Node: Bun's runtime crashes loading Next's server runtime
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma client 是產生出來的，不在版控內，build 前必須先產生。
# 這一步只讀 schema，不需要連得到資料庫
RUN npx prisma generate

# 媒體檔案的 CDN 網域會被 next.config.ts 的 remotePatterns 與前端 bundle
# 讀取，兩者都在 build 時定案，故須以 build arg 傳入而非執行期環境變數
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN node node_modules/next/dist/bin/next build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# sharp 的預編譯二進位檔是對 glibc 連結的，alpine 用的是 musl。
# 少了這個相容層，上傳圖片時會在執行期才拋出載入失敗
RUN apk add --no-cache libc6-compat

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sharp 的二進位檔與平台綁定，從 builder 複製過來的不一定相符
#（在 macOS 開發時裝到的是 darwin 版）。直接在此安裝 linux-musl 版本，
# 讓它與 runner 的作業系統一致
RUN npm install --omit=dev --no-package-lock --no-save sharp@0.35.4 \
  && chown -R nextjs:nodejs ./node_modules

# standalone 的追蹤不會帶上產生出來的 Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/app/generated ./app/generated

# migrate deploy 需要 schema 與 CLI，兩者都不在 standalone 產出內
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
