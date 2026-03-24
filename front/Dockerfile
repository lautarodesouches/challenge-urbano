# ==========================================
# STAGE 1: Build (El entorno de construcción)
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app
RUN corepack enable pnpm

# Argumento para inyectar la URL del backend durante el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ==========================================
# STAGE 2: Production (El servidor real)
# ==========================================
FROM nginx:alpine

# Copiamos solo los archivos estáticos finales
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos una configuración de Nginx para manejar React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]