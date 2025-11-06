const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get Digitransit API key from environment
  const digitransitKey = process.env.REACT_APP_DIGITRANSIT_KEY || 'd253c31db9ab41c195f7ef36fc250da4';

  // Proxy for Digitransit map tiles
  app.use(
    '/digitransit-api/map',
    createProxyMiddleware({
      target: 'https://cdn.digitransit.fi',
      changeOrigin: true,
      pathRewrite: {
        '^/digitransit-api/map': '/map',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('digitransit-subscription-key', digitransitKey);
        proxyReq.setHeader('Host', 'cdn.digitransit.fi');
      },
    })
  );

  // Proxy for Digitransit geocoding API
  app.use(
    '/digitransit-api/geocoding',
    createProxyMiddleware({
      target: 'https://api.digitransit.fi',
      changeOrigin: true,
      pathRewrite: {
        '^/digitransit-api/geocoding': '/geocoding',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('digitransit-subscription-key', digitransitKey);
        proxyReq.setHeader('Host', 'api.digitransit.fi');
      },
    })
  );

  // Proxy for HSY WMS services
  app.use(
    '/hsy-proxy',
    createProxyMiddleware({
      target: 'https://kartta.hsy.fi',
      changeOrigin: true,
      pathRewrite: {
        '^/hsy-proxy': '',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Host', 'kartta.hsy.fi');
      },
    })
  );

  // Proxy for Overpass API
  app.use(
    '/overpass-proxy',
    createProxyMiddleware({
      target: 'https://overpass.fvh.io',
      changeOrigin: true,
      pathRewrite: {
        '^/overpass-proxy': '',
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Host', 'overpass.fvh.io');
      },
    })
  );
};
