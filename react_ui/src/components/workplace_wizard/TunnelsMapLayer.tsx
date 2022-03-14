import React from 'react';
import {overpassQuery} from "util_components/osm/utils";
import {geocoderFocus} from "components/workplace_wizard/settings";
import {GeoJSON} from 'react-leaflet';
import {GeoJsonObject} from "geojson";
import osmtogeojson from "osmtogeojson";
import * as L from 'leaflet';
import {LatLng} from "leaflet";

import './TunnelsMapLayer.scss';

type TunnelsMapLayerProps = {}

type TunnelsMapLayerState = {
  tunnelFeatures?: GeoJsonObject
}

const initialState: TunnelsMapLayerState = {};

const query = `
  way[layer~"^-[123456789]"][highway!~"^(footway|steps|corridor|cycleway)"][highway][tunnel];
  node[layer~"^-[123456789]"][barrier=gate];
  node[layer~"^-[123456789]"][entrance];
  node[layer~"^-[123456789]"]["parking:condition"=loading]`;

const options = {
  nodes: {radius: 4, stroke: false, fillOpacity: 1, fillColor: '#000'},
  ways: {width: 3, opacity: 0.8},
  layerColors: {'-4': "#770000", '-3': "#ff0000", '-2': "#ff7700", '-1': "#ffff00"},
  label: {permanent: true, direction: 'bottom', className: 'osmMapLabel', pane: 'markerPane'}
};

export default class TunnelsMapLayer extends React.Component<TunnelsMapLayerProps, TunnelsMapLayerState> {
  state = initialState;

  render() {
    const {} = this.props;
    const {tunnelFeatures} = this.state;
    return !tunnelFeatures ? null :
      <GeoJSON data={tunnelFeatures} pointToLayer={this.pointToLayer} style={this.wayStyle}/>;
  }

  componentDidMount() {
    overpassQuery(query, geocoderFocus, 5000).then((elements) => {
      this.setState({tunnelFeatures: osmtogeojson({elements}) as GeoJsonObject});
    })
  }

  pointToLayer = (p: any, latlng: LatLng) =>
    L.circleMarker(latlng, options.nodes)
      // @ts-ignore
      .bindTooltip(p.properties.name || p.properties.description || p.properties.ref || '', options.label);

  wayStyle = (w: any) => {
    // @ts-ignore
    return {...options.ways, color: options.layerColors[w.properties.layer] || '#000'}
  }
}
