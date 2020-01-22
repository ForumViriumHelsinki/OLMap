import React from 'react';
// @ts-ignore
import * as L from 'leaflet';
import settings from 'settings.json';

import styles from 'leaflet/dist/leaflet.css';

import GlyphIcon from "util_components/GlyphIcon";
import Geolocator from "util_components/Geolocator";
import {Location} from 'util_components/types';
import Icon from "util_components/Icon";
// @ts-ignore
import {Button} from "reactstrap";

type MapProps = {
  requestLocation?: boolean,
  onLocationSelected?: (location: any) => any
}

export default class Map extends React.Component<MapProps, {currentPosition: null | Location}> {
  state = {
    currentPosition: null
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
    const {requestLocation, onLocationSelected} = this.props;

    return <div className="position-relative">
      <div className="position-absolute p-2 text-center w-100" style={{zIndex: 500}}>
        {requestLocation &&
          <Button color="primary" size="sm"
                  onClick={() => onLocationSelected && onLocationSelected(this.leafletMap.getCenter())}>
            Select here
          </Button>
        }
      </div>
      <div id="leafletMap" style={{height: '70vh'}}> </div>
      <Geolocator onLocation={([lat, lon]) => this.setState({currentPosition: {lat, lon}})}/>
    </div>;
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
    const {requestLocation} = this.props;

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
      this.leafletMap.on('zoomstart', () => this.userMovedMap = true);
      this.leafletMap.on('movestart', () => this.userMovedMap = true);
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

      if (!this.userMovedMap) this.leafletMap.setView(latlng, 18);
      if (marker) marker.setLatLng(latlng);
      else {
        const icon = new GlyphIcon({glyph: 'my_location', glyphSize: 20});
        this.markers.currentPosition = L.marker(latlng, {icon}).addTo(this.leafletMap);
      }
    }
  }

  private mapMoved() {
    const marker = this.markers.selectedPosition;
    if (marker) marker.setLatLng(this.leafletMap.getCenter())
  }
}

