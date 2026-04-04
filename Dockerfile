# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npx ng build --configuration production

# Runtime stage
FROM nginx:alpine AS runtime

# Install curl for health checks and remove default content
RUN apk add --no-cache curl && rm -rf /usr/share/nginx/html/*

# Copy built Angular app
COPY --from=build /app/dist/basta-client/browser /usr/share/nginx/html

# Copy a simple nginx config for serving the SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1
