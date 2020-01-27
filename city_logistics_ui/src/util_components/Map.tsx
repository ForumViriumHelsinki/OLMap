import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import settings from 'settings.json';

import 'leaflet/dist/leaflet.css';

import GlyphIcon from "util_components/GlyphIcon";
import Geolocator from "util_components/Geolocator";
import {Location} from 'util_components/types';
import Icon from "util_components/Icon";
// @ts-ignore
import {Button} from "reactstrap";

import './Map.css';

const dotIcon = L.divIcon({className: "dotIcon", iconSize: [16, 16]});

export type MapMarker = Location & { onClick: () => any };

type MapProps = {
  requestLocation?: boolean,
  onLocationSelected?: (location: any) => any
  dotMarkers?: MapMarker[]
}

export default class Map extends React.Component<MapProps, {currentPosition: null | Location, userMovedMap: boolean}> {
  state = {
    currentPosition: null,
    userMovedMap: false
  };

  private leafletMap: any = null;
  private markers: {currentPosition?: any, selectedPosition?: any} = {};
  private dotMarkers?: object[] = undefined;

  initMapState() {
    this.leafletMap = null;
    this.markers = {};
    this.dotMarkers = undefined;
  }

  render() {
    const {requestLocation, onLocationSelected} = this.props;
    const {userMovedMap} = this.state;

    return <div className="position-relative">
      {requestLocation &&
        <div className="position-absolute p-2 text-center w-100" style={{zIndex: 500}}>
            <Button color="primary" size="sm" onClick={() => this.onLocationSelected()}>
              Select here
            </Button>
        </div>
      }
      {userMovedMap &&
        <div className="position-absolute" style={{zIndex: 500, right: 12, bottom: 36}}>
            <Button color="primary" size="sm" onClick={() => this.setState({userMovedMap: false})}>
              <i className="material-icons">my_location</i>
            </Button>
        </div>
      }
      <div id="leafletMap" style={{height: 'calc(100vh - 240px)'}}> </div>
      <Geolocator onLocation={([lon, lat]) => this.setState({currentPosition: {lat, lon}})}/>
    </div>;
  }

  private onLocationSelected() {
    const {onLocationSelected} = this.props;
    const {lat, lng} = this.leafletMap.getCenter();
    return onLocationSelected && onLocationSelected([lng, lat]);
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
    const {currentPosition} = this.state;
    const {requestLocation, dotMarkers} = this.props;

    if (!this.leafletMap) {
      this.leafletMap = L.map('leafletMap');
      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: 'RouteMapModal data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
                     '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
                     'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 21,
        id: 'mapbox/streets-v11',
        accessToken: settings.MapBox.accessToken
      }).addTo(this.leafletMap);
      this.leafletMap.on('zoomstart', () => this.setState({userMovedMap: true}));
      this.leafletMap.on('movestart', () => this.setState({userMovedMap: true}));
      this.leafletMap.on('move', () => this.mapMoved());
    }

    if (requestLocation) {
      if (!this.markers.selectedPosition) {
        const icon = new GlyphIcon({glyph: 'add', glyphSize: 20});
        this.markers.selectedPosition = L.marker(this.leafletMap.getCenter(),{icon}).addTo(this.leafletMap);
      }
    } else if (this.markers.selectedPosition) {
      this.markers.selectedPosition.remove();
      this.markers.selectedPosition = undefined;
    }

    if (currentPosition) {
      // @ts-ignore
      const latlng = [currentPosition.lat, currentPosition.lon];
      const marker = this.markers.currentPosition;

      if (!this.state.userMovedMap) this.leafletMap.setView(latlng, 18);
      if (marker) marker.setLatLng(latlng);
      else {
        const icon = new GlyphIcon({glyph: 'my_location', glyphSize: 20});
        this.markers.currentPosition = L.marker(latlng, {icon}).addTo(this.leafletMap);
      }
    }
    if (dotMarkers && !(this.dotMarkers && this.dotMarkers.length))
      this.dotMarkers = dotMarkers.map((dotMarker) => {
        const marker = L.marker({lon: dotMarker.lon, lat: dotMarker.lat}, {icon: dotIcon})
        marker.on('click', dotMarker.onClick)
        marker.addTo(this.leafletMap);
        return marker;
      })
  }

  private mapMoved() {
    const marker = this.markers.selectedPosition;
    if (marker) marker.setLatLng(this.leafletMap.getCenter())
  }
}

