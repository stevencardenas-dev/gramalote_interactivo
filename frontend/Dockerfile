# syntax=docker/dockerfile:1

# ---- Etapa 1: build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .

# La base "/" es la correcta cuando se sirve en la raíz del dominio.
# El workflow de GitHub Pages sobreescribe esto con /gramalote_interactivo/.
ARG VITE_BASE=/
ENV VITE_BASE=${VITE_BASE}

RUN npm run build


# ---- Etapa 2: runtime ----
FROM nginx:1.27-alpine AS runtime

RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
