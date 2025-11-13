# Multi-stage build for React application
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Build arguments for React environment variables
ARG REACT_APP_SERVER_ROOT=http://localhost:8000
ARG REACT_APP_MAPBOX_TOKEN
ARG REACT_APP_DIGITRANSIT_KEY
ARG REACT_APP_OVERPASS_URL=https://overpass.fvh.io/api/interpreter
ARG REACT_APP_DEFAULT_LAT=60.17012
ARG REACT_APP_DEFAULT_LON=24.94290
ARG REACT_APP_USE_MOCK_LOCATION=true
ARG REACT_APP_MOCK_LAT=60.161687
ARG REACT_APP_MOCK_LON=24.944368

# Set environment variables from build args
ENV REACT_APP_SERVER_ROOT=$REACT_APP_SERVER_ROOT
ENV REACT_APP_MAPBOX_TOKEN=$REACT_APP_MAPBOX_TOKEN
ENV REACT_APP_DIGITRANSIT_KEY=$REACT_APP_DIGITRANSIT_KEY
ENV REACT_APP_OVERPASS_URL=$REACT_APP_OVERPASS_URL
ENV REACT_APP_DEFAULT_LAT=$REACT_APP_DEFAULT_LAT
ENV REACT_APP_DEFAULT_LON=$REACT_APP_DEFAULT_LON
ENV REACT_APP_USE_MOCK_LOCATION=$REACT_APP_USE_MOCK_LOCATION
ENV REACT_APP_MOCK_LAT=$REACT_APP_MOCK_LAT
ENV REACT_APP_MOCK_LON=$REACT_APP_MOCK_LON

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

# Install curl for health checks and envsubst for template processing
# hadolint ignore=DL3018
RUN apk add --no-cache curl gettext

# Create non-root user first
RUN addgroup -g 1001 -S olmap && \
    adduser -S olmap -u 1001 -G olmap

# Copy nginx configuration template
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built application from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create temp directories for nginx and set permissions
RUN mkdir -p /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R olmap:olmap /usr/share/nginx/html && \
    chown -R olmap:olmap /tmp/client_temp /tmp/proxy_temp_path /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown olmap:olmap /etc/nginx/nginx.conf.template

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Switch to non-root user
USER olmap

# Use entrypoint script to substitute environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
