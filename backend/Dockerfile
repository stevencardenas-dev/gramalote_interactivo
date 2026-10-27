# syntax=docker/dockerfile:1

# ---- API de Gramalote (Express + MySQL) ----
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Solo dependencias de ejecución: la API no compila nada.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Código, rutas y scripts (scripts/seed-admin.js se usa para crear el admin).
COPY src ./src
COPY scripts ./scripts
COPY package.json ./

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/health || exit 1

CMD ["node", "src/server.js"]
