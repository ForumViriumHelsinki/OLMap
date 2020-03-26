import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import settings from 'settings.json';

import 'leaflet/dist/leaflet.css';

type MapProps = {
  onMapInitialized?: (leafletMap: any) => any,
  latLng: number[],
  zoom: number,
  extraLayers?: any[],
  showAttribution: boolean,
  zoomControl: boolean
}

let idCounter = 0;

export default class Map extends React.Component<MapProps> {
  private leafletMap: any = null;
  private id = idCounter++;

  static defaultProps = {
    zoom: 18,
    latLng: settings.defaultLocation,
    showAttribution: true,
    zoomControl: true
  };

  initMapState() {
    this.leafletMap = null;
  }

  render() {
    return <div id={this.getMapElId()} style={{height: '100%'}}> </div>
  }

  private getMapElId() {
    return "leafletMap" + this.id;
  }

  componentDidMount() {
    this.refreshMap();
  }

  componentWillUnmount() {
    if (this.leafletMap) this.leafletMap.remove();
    this.initMapState()
  }

  componentDidUpdate() {
    this.refreshMap();
  }

  refreshMap() {
    const {latLng, zoom, extraLayers, onMapInitialized, showAttribution, zoomControl} = this.props;

    if (!this.leafletMap) {
      this.leafletMap = L.map(this.getMapElId(), {
        attributionControl: showAttribution,
        zoomControl: zoomControl
      });
      this.leafletMap.setView(latLng, zoom);
      const attribution = 'Data &copy; <a href="https://www.openstreetmap.org/">OSM</a> contribs, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Img © <a href="https://www.mapbox.com/">Mapbox</a>';
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: showAttribution ? attribution : '',
        maxZoom: 21,
        id: 'mapbox/streets-v11',
        accessToken: settings.MapBox.accessToken
      }).addTo(this.leafletMap);
      if (onMapInitialized) onMapInitialized(this.leafletMap);
    }
    if (extraLayers) extraLayers.forEach(mapLayer => {
      if (!this.leafletMap.hasLayer(mapLayer)) mapLayer.addTo(this.leafletMap)
    })
  }
}
