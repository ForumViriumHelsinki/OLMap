import React from 'react';

// @ts-ignore
import * as L from 'leaflet';

import Icon from "util_components/Icon";
import Map from "util_components/Map";
import {getCenter, getDistance} from "geolib";
import {OSMFeature} from "util_components/osm/types";
import GlyphIcon from 'util_components/GlyphIcon';

const successDotIcon = L.divIcon({className: "dotIcon successDotIcon", iconSize: [24, 24]});

type OSMFeatureMapPopupProps = {
  osmFeature: OSMFeature,
  location: any // location in some form recognized by geolib
}

type OSMFeatureMapPopupState = {
  open: boolean
}

const initialState: OSMFeatureMapPopupState = {
  open: false
};

function latLng(location: any) {
  return [location.latitude, location.longitude];
}

export default class OSMFeatureMapPopup extends React.Component<OSMFeatureMapPopupProps, OSMFeatureMapPopupState> {
  state = initialState;

  render() {
    const {osmFeature, location} = this.props;
    const {open} = this.state;

    if (!(osmFeature.lat && osmFeature.lon)) return '';

    return <div className="position-relative d-inline-block mr-1">
      <button className="btn btn-mini btn-outline-primary p-1"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                this.setState({open: !open})
              }}>
        <Icon icon='place'/>
      </button>
      {open &&
        <div className="position-absolute p-2 rounded clickable bg-light shadow"
             style={{top: -48, left: 32, width: 128, height: 128, zIndex: 10}}
             onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                this.setState({open: false})
             }}>
          <Map latLng={latLng(getCenter([osmFeature, location]))}
               zoom={20 - getDistance(osmFeature, location) / 8}
               zoomControl={false}
               extraLayers={[this.getMapLayer()]}
               showAttribution={false}/>
        </div>
      }
    </div>;
  }

  private getMapLayer() {
    const {location, osmFeature} = this.props;
    const mapLayer = L.layerGroup();
    L.marker({lon: location[0], lat: location[1]}, {icon: successDotIcon}).addTo(mapLayer);
    L.marker(osmFeature, {icon: new GlyphIcon({glyph: 'star'})}).addTo(mapLayer);
    return mapLayer;
  }
}
