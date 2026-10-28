# ---------- Etapa 1: compilar el proyecto ----------
FROM node:24-slim AS build
WORKDIR /app

# Primero solo los package*.json: así Docker reutiliza la caché si no cambian las dependencias
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- Etapa 2: imagen final (liviana) ----------
FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción (sin Jest, Nest CLI, etc.)
COPY package*.json ./
RUN npm ci --omit=dev

# Solo el código ya compilado
COPY --from=build /app/dist ./dist

EXPOSE 3000
USER node
CMD ["node", "dist/main"]