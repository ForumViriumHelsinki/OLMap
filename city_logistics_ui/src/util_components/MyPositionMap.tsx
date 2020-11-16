import React from 'react';
import {getBounds} from 'geolib';
// @ts-ignore
import * as L from 'leaflet';
import settings from 'settings.json';

import 'leaflet/dist/leaflet.css';

import GlyphIcon from "util_components/GlyphIcon";
import Geolocator from "util_components/Geolocator";
import {Location} from 'util_components/types';
// @ts-ignore
import {Button} from "reactstrap";
import Map from "util_components/Map";
import urlMapPosition from "util_components/urlMapPosition";

type MapProps = {
  requestLocation?: boolean,
  onLocationSelected?: (location: any) => any
  extraLayers?: any[]
}

export default class MyPositionMap extends React.Component<MapProps, {currentPosition?: Location, userMovedMap: boolean}> {
  state = {
    currentPosition: undefined,
    userMovedMap: false
  };

  private leafletMap: any = null;
  private markers: {currentPosition?: any, selectedPosition?: any} = {};
  private userMovedMap: boolean = false;

  initMapState() {
    this.leafletMap = null;
    this.markers = {};
    this.userMovedMap = false;
  }

  render() {
    const {requestLocation, extraLayers} = this.props;
    const {currentPosition} = this.state;
    const latlng = this.getInitialPosition();

    return <div className="position-relative">
      {requestLocation &&
        <div className="position-absolute p-2 text-center w-100" style={{zIndex: 500}}>
            <Button color="primary" size="sm" onClick={() => this.onLocationSelected()}>
              Select here
            </Button>
        </div>
      }
      {currentPosition &&
        <div className="position-absolute" style={{zIndex: 401, right: 12, bottom: 36}}>
            <Button color="primary" size="sm" onClick={this.gotoMyLocation}>
              <i className="material-icons">my_location</i>
            </Button>
        </div>
      }
      <Map extraLayers={extraLayers} latLng={latlng} onMapInitialized={this.onMapInitialized}/>
      <Geolocator onLocation={([lon, lat]) => this.setState({currentPosition: {lat, lon}})}/>
    </div>;
  }

  private onLocationSelected() {
    const {onLocationSelected} = this.props;
    const {lat, lng} = this.leafletMap.getCenter();
    return onLocationSelected && onLocationSelected([lng, lat]);
  }

  componentWillUnmount() {
    this.initMapState()
  }

  componentDidUpdate() {
    this.refreshMap();
  }

  getInitialPosition() {
    const {currentPosition} = this.state;
    const positionFromUrl = urlMapPosition.read();
    // @ts-ignore
    const currentLatLng = currentPosition && [currentPosition.lat, currentPosition.lon];
    return (positionFromUrl || currentLatLng || settings.defaultLocation);
  }

  refreshMap() {
    const {requestLocation} = this.props;
    const {currentPosition} = this.state;
    // @ts-ignore
    const currentLatLng = currentPosition && [currentPosition.lat, currentPosition.lon];
    const position = this.getInitialPosition();
    if (!this.state.userMovedMap) this.leafletMap.setView(position, position[2] || 18);

    if (requestLocation) {
      if (!this.markers.selectedPosition) {
        const icon = new GlyphIcon({glyph: 'add', glyphSize: 20});
        this.markers.selectedPosition = L.marker(this.leafletMap.getCenter(), {icon}).addTo(this.leafletMap);
      }
    } else if (this.markers.selectedPosition) {
      this.markers.selectedPosition.remove();
      this.markers.selectedPosition = undefined;
    }

    if (currentPosition) {
      const marker = this.markers.currentPosition;
      if (marker) marker.setLatLng(currentLatLng);
      else {
        const icon = new GlyphIcon({glyph: 'my_location', glyphSize: 20});
        this.markers.currentPosition = L.marker(currentLatLng, {icon}).addTo(this.leafletMap);
      }
    }
  }

  getMapState() {
    const center = this.leafletMap.getCenter();
    return [center.lat, center.lng, this.leafletMap.getZoom()] as [number, number, number];
  }

  onMapInitialized = (leafletMap: any) => {
    this.leafletMap = leafletMap;
    this.leafletMap.on('zoomstart', () => this.setState({userMovedMap: true}));
    this.leafletMap.on('movestart', () => this.setState({userMovedMap: true}));
    this.leafletMap.on('move', () => this.mapMoved());
    this.leafletMap.on('zoomend', () => urlMapPosition.write(...this.getMapState()));
    this.leafletMap.on('moveend', () => urlMapPosition.write(...this.getMapState()));
    this.refreshMap();
  };

  private mapMoved() {
    const marker = this.markers.selectedPosition;
    if (marker) marker.setLatLng(this.leafletMap.getCenter())
  }

  showLocation(location: any) {
    if (this.leafletMap) this.leafletMap.setView(location, 20);
  }

  gotoMyLocation = () => {
    const {currentPosition} = this.state;
    if (!currentPosition) return;
    // @ts-ignore
    const currentLatLng =  [currentPosition.lat, currentPosition.lon];
    this.leafletMap.setView(currentLatLng, 18);
  };

  showPoints(points: any[]) {
    if (this.leafletMap) {
      const bounds = getBounds(points);
      this.leafletMap.fitBounds([[bounds.minLat, bounds.minLng], [bounds.maxLat, bounds.maxLng]]);
    }
  }
}
