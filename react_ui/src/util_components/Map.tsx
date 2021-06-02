import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import 'mapbox-gl-leaflet';
import settings from 'settings.json';

import 'leaflet/dist/leaflet.css';
import {LocationTuple} from "util_components/types";

type MapProps = {
  onMapInitialized?: (leafletMap: any) => any,
  latLng: LocationTuple,
  zoom: number,
  extraLayers?: any[],
  showAttribution: boolean,
  zoomControl: boolean,
  onClick?: (latLng: LocationTuple) => any
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

  componentDidUpdate(prevProps?: Readonly<MapProps>) {
    if (prevProps && prevProps.extraLayers) prevProps.extraLayers.forEach(layer => {
      if (!this.props.extraLayers?.includes(layer)) layer.remove();
    });
    this.refreshMap();
  }

  refreshMap() {
    const {latLng, zoom, extraLayers, onMapInitialized, showAttribution, zoomControl, onClick} = this.props;

    if (!this.leafletMap) {
      this.leafletMap = L.map(this.getMapElId(), {
        attributionControl: showAttribution,
        zoomControl: zoomControl,
        preferCanvas: true
      });
      this.leafletMap.setView(latLng, zoom);
      const attribution = 'Data &copy; <a href="https://www.openstreetmap.org/">OSM</a> contribs, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
      // @ts-ignore
      L.mapboxGL({
        style: 'https://raw.githubusercontent.com/HSLdevcom/hsl-map-style/master/simple-style.json',
        accessToken: settings.MapBox.accessToken,
        attribution: showAttribution ? attribution : '',
        maxZoom: 21,
      }).addTo(this.leafletMap);

      if (onClick) {
        this.leafletMap.on('click', (e: any) => {
          onClick([e.latlng.lat, e.latlng.lng]);
        });
      }

      if (onMapInitialized) onMapInitialized(this.leafletMap);
    }
    if (extraLayers) extraLayers.forEach(mapLayer => {
      if (!this.leafletMap.hasLayer(mapLayer)) mapLayer.addTo(this.leafletMap)
    })
  }
}
