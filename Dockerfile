FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml tsconfig.json tsconfig.build.json ./
COPY src ./src
COPY locales ./locales
COPY server_config.example.yml ./

RUN corepack enable
RUN corepack prepare pnpm@9.15.4 --activate

RUN pnpm install --frozen-lockfile
RUN pnpm run build
RUN pnpm prune --prod

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ARG PHIRA_MP_VERSION

ENV NODE_ENV=production
ENV PHIRA_MP_HOME=/app
ENV PHIRA_MP_VERSION=${PHIRA_MP_VERSION}

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/locales ./locales
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/server_config.example.yml ./server_config.example.yml

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 12346
EXPOSE 12347

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/server/main.js"]
