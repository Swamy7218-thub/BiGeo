FROM node:22-slim AS build
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile && pnpm --filter @bigeo/address-resolver build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/address-resolver/dist ./dist
COPY --from=build /app/services/address-resolver/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
