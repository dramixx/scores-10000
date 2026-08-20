# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# adapter-node's server bundle imports @sveltejs/kit (and other build-time-only
# packages) by bare specifier at runtime, so the full node_modules tree —
# not just "dependencies" — has to be present in the final image.
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY package.json ./

EXPOSE 3000
USER node

CMD ["node", "build/index.js"]
