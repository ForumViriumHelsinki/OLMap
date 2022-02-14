import React from 'react';

import {
  nearbyEntrancesUrl,
} from "components/workplace_wizard/urls";
import {MapFeature, Point, Workplace} from "components/workplace_wizard/types";
import {Marker, Popup} from "react-leaflet";
import * as L from "leaflet";
import delivery_icon from './delivery_entrance.svg';
import sessionRequest from "sessionRequest";
import {LatLngLiteral} from "leaflet";

type EntrancesMapLayerProps = {
  location: Point,
  Popup?: any
}

type EntrancesMapLayerState = {
  nearbyEntrances?: MapFeature[],
}

const initialState: EntrancesMapLayerState = {};

const size = 20;
const icon =  L.divIcon({
    className: 'mapIcon discrete',
    html: `<img src="${delivery_icon}"/>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });

export default class EntrancesMapLayer extends React.Component<EntrancesMapLayerProps, EntrancesMapLayerState> {
  state = initialState;

  render() {
    const {Popup} = this.props;
    const {nearbyEntrances} = this.state;
    return nearbyEntrances && nearbyEntrances.map(entrance =>
      <Marker key={entrance.id} position={this.latLng(entrance)} icon={icon}
              zIndexOffset={-1000}>
        {Popup && <Popup entrance={entrance}/>}
      </Marker>
    ) || null;
  }

  componentDidMount() {
    this.loadNearbyEntrances();
  }

  componentDidUpdate(prevProps: Readonly<EntrancesMapLayerProps>) {
    const {lat, lon} = prevProps.location, l = this.props.location;
    if ((l.lat != lat) || (l.lon != lon)) this.loadNearbyEntrances();
  }

  loadNearbyEntrances() {
    const {lon, lat} = this.props.location;
    if (!(lon && lat)) return;
    sessionRequest(nearbyEntrancesUrl({lon, lat})).then(response => response.json())
    .then(nearbyEntrances => this.setState({nearbyEntrances}))
  }

  private latLng(feature: MapFeature) {
    const {lat, lon} = feature || {};
    const latLng = {lng: lon, lat} as LatLngLiteral;
    return latLng;
  }
}
