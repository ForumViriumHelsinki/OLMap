#!/bin/sh
# Entrypoint script for nginx container
# Substitutes environment variables in nginx config and starts nginx

# Set default value for REACT_APP_DIGITRANSIT_KEY if not provided
export REACT_APP_DIGITRANSIT_KEY="${REACT_APP_DIGITRANSIT_KEY:-d253c31db9ab41c195f7ef36fc250da4}"

# Substitute environment variables in nginx config to a temp location
envsubst '${REACT_APP_DIGITRANSIT_KEY}' < /etc/nginx/nginx.conf.template > /tmp/nginx.conf

# Print config for debugging (optional - remove in production)
echo "Nginx configuration generated with API key: ${REACT_APP_DIGITRANSIT_KEY:0:10}..."

# Start nginx with the custom config location
exec nginx -c /tmp/nginx.conf -g "daemon off;"