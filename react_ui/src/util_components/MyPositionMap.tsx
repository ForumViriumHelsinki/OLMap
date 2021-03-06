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
  onLocationSelected?: (location: any) => any
  extraLayers?: any[],
  location?: Location,
  zoom?: number
}

type MapState = { currentPosition?: Location, userMovedMap: boolean };

export default class MyPositionMap extends React.Component<MapProps, MapState> {
  state = {
    currentPosition: undefined,
    userMovedMap: false
  };

  private leafletMap: any = null;
  private markers: {currentPosition?: any, selectedPosition?: any} = {};

  initMapState() {
    this.leafletMap = null;
    this.markers = {};
  }

  render() {
    const {onLocationSelected, extraLayers} = this.props;
    const {currentPosition} = this.state;
    const latlng = this.getInitialPosition();

    return <div className="position-relative">
      {onLocationSelected &&
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
      <Map extraLayers={extraLayers} latLng={latlng} onMapInitialized={this.onMapInitialized} backgroundChangeable />
      <Geolocator onLocation={([lon, lat]) => this.setState({currentPosition: {lat, lon}})}/>
    </div>;
  }

  private onLocationSelected() {
    const {onLocationSelected} = this.props;
    const {lat, lng} = this.leafletMap.getCenter();
    return onLocationSelected && onLocationSelected({lon: lng, lat});
  }

  componentWillUnmount() {
    this.initMapState()
  }

  componentDidUpdate(prevProps: MapProps) {
    const location = this.props.location;
    if (location && location != prevProps.location) {
      urlMapPosition.write(location.lat, location.lon, this.leafletMap?.getZoom() || 18);
      this.setState({userMovedMap: false});
    }
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
    const {onLocationSelected, zoom} = this.props;
    const {currentPosition} = this.state;
    // @ts-ignore
    const currentLatLng = currentPosition && [currentPosition.lat, currentPosition.lon];
    const position = this.getInitialPosition();
    if (!this.state.userMovedMap) this.leafletMap.setView(position, position[2] || zoom || 18);

    if (onLocationSelected) {
      if (!this.markers.selectedPosition) {
        // @ts-ignore
        const icon = new GlyphIcon({glyph: 'add', glyphSize: 20});
        this.markers.selectedPosition = L.marker(this.leafletMap.getCenter(), {icon}).addTo(this.leafletMap);
      }
    } else if (this.markers.selectedPosition) {
      this.markers.selectedPosition.remove();
      this.markers.selectedPosition = undefined;
    }

    if (currentLatLng) {
      const marker = this.markers.currentPosition;
      if (marker) marker.setLatLng(currentLatLng);
      else {
        // @ts-ignore
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
