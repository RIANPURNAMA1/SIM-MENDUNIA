# ─── Stage 1: Build Frontend ──────────────────────────
FROM node:18-alpine AS frontend-builder

ARG VITE_API_URL=http://localhost/api
ARG VITE_APP_URL=http://localhost

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN VITE_API_URL=${VITE_API_URL} VITE_APP_URL=${VITE_APP_URL} npm run build

# ─── Stage 2: Nginx ──────────────────────────────────
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy frontend build output
COPY --from=frontend-builder /app/dist /var/www/frontend

# Create storage symlink directory
RUN mkdir -p /var/www/backend/storage/app/public

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
