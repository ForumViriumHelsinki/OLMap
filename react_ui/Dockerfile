# Multi-stage build for React application
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user first
RUN addgroup -g 1001 -S olmap && \
    adduser -S olmap -u 1001 -G olmap

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create temp directories for nginx and set permissions
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R olmap:olmap /usr/share/nginx/html && \
    chown -R olmap:olmap /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Switch to non-root user
USER olmap

# Start nginx
CMD ["nginx", "-g", "daemon off;"]