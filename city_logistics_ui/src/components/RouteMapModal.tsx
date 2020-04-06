import React from 'react';
import Modal from "util_components/Modal";
// @ts-ignore
import * as L from 'leaflet';
import settings from 'settings.json';

import GlyphIcon from "util_components/GlyphIcon";
import Geolocator from "util_components/Geolocator";
import Map from "util_components/Map";
import {Location, Address} from 'util_components/types';
import OSMImageNotes from "components/osm_image_notes/OSMImageNotes";

export type BaseMapProps = {
  origin: Address,
  destination: Address,
  currentPosition?: Location,
  currentPositionIndex?: number,
}

export type MapProps = BaseMapProps & {
  onClose: () => any
}

export default class RouteMapModal extends React.Component<MapProps, {currentPosition: null | Location}> {
  state = {
    currentPosition: null
  };

  private leafletMap: any = null;
  private markers: {
    origin?: any, destination?: any, currentPosition?: any
  } = {};
  private path: any = null;
  private pathLayer: any = null;
  private userMovedMap: boolean = false;
  private imageNotesLayer?: any;

  initMapState() {
    this.leafletMap = null;
    this.markers = {};
    this.path = null;
    this.pathLayer = null;
    this.userMovedMap = false;
  }

  render() {
    const {origin, destination, onClose, currentPositionIndex=0} = this.props;
    const currentPosition = this.getCurrentPosition();

    return <Modal title={`${origin.street_address} to ${destination.street_address}`} onClose={onClose}>
      <OSMImageNotes onMapLayerLoaded={(mapLayer) => {this.imageNotesLayer = mapLayer; this.refreshMap()}}/>
      <div style={{height: '70vh'}}>
        <Map extraLayers={this.getMapLayers()}
             latLng={currentPosition ? [currentPosition.lat, currentPosition.lon] : undefined}
             onMapInitialized={this.setMap}/>
      </div>
      {(currentPositionIndex > -1) && !this.props.currentPosition &&
        <Geolocator onLocation={([lon, lat]) => this.setState({currentPosition: {lat, lon}})}/>
      }
    </Modal>;
  }

  setMap = (leafletMap: any) => {
    this.leafletMap = leafletMap;
    this.leafletMap.on('zoomstart', () => this.userMovedMap = true);
    this.leafletMap.on('movestart', () => this.userMovedMap = true);
  };

  componentDidMount() {
    this.refreshMap();
  }

  componentWillUnmount() {
    this.initMapState()
  }

  componentDidUpdate() {
    this.refreshMap();
  }

  getMapLayers() {
    const {origin, destination} = this.props;
    const currentPosition = this.getCurrentPosition();

    if (!this.pathLayer) {
      this.pathLayer = L.layerGroup();
      this.path = L.polyline([]);
      this.path.addTo(this.pathLayer);
    }
    this.path.setLatLngs(this.coords().map(({lat, lon}) => [lat, lon]));

    Object.entries({origin, destination, currentPosition}).forEach(([name, coord]) => {
      if (!coord) return;
      // @ts-ignore
      const marker = this.markers[name], glyph = settings.markerIcons[name];
      if (marker) marker.setLatLng([coord.lat, coord.lon]);
      // @ts-ignore
      else this.markers[name] = L.marker(
          [coord.lat, coord.lon],
          {icon: new GlyphIcon({glyph, glyphSize: 20})}
        ).addTo(this.pathLayer);
    });

    if (this.imageNotesLayer) return [this.imageNotesLayer, this.pathLayer];
    else return [this.pathLayer];
  }

  refreshMap() {
    if (!this.userMovedMap) this.leafletMap.fitBounds(this.bounds());
  }

  getCurrentPosition() {
    return this.props.currentPosition || this.state.currentPosition;
  }

  coords() {
    const {origin, destination} = this.props;
    const currentPositionIndex = this.props.currentPositionIndex || 0;
    const currentPosition = this.getCurrentPosition();
    const coords: Location[] = [origin, destination];

    if (currentPosition && (currentPositionIndex >= 0)) {
      coords.splice(currentPositionIndex, 0, currentPosition);
    }
    return coords;
  }

  bounds() {
    const coords = this.coords();
    const lats = coords.map((c) => c.lat);
    const lons = coords.map((c) => c.lon);
    return [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];
  }
}
