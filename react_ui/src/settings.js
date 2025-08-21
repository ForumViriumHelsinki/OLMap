const settings = {
  serverRoot: process.env.REACT_APP_SERVER_ROOT || "http://localhost:8000",
  MapBox: {
    accessToken: process.env.REACT_APP_MAPBOX_TOKEN || "pk.eyJ1Ijoiam9oYW4tZnZoIiwiYSI6ImNrNDJtOGh5cDAxczIzb3FpdHg1Z3c5MGwifQ.bp9ubCm67HLIorEUb21K3A"
  },
  useMockGeolocation: process.env.REACT_APP_USE_MOCK_LOCATION === 'true' ? [
    parseFloat(process.env.REACT_APP_MOCK_LON || "24.944368"), 
    parseFloat(process.env.REACT_APP_MOCK_LAT || "60.161687")
  ] : false,
  defaultLocation: [
    parseFloat(process.env.REACT_APP_DEFAULT_LAT || "60.17012"), 
    parseFloat(process.env.REACT_APP_DEFAULT_LON || "24.94290")
  ],
  overpassInterpreterPath: process.env.REACT_APP_OVERPASS_URL || "https://overpass.fvh.io/api/interpreter",
  digitransitKey: process.env.REACT_APP_DIGITRANSIT_KEY || "d253c31db9ab41c195f7ef36fc250da4"
};

export default settings;
