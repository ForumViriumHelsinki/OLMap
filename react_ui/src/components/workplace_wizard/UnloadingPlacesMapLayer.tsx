import React from 'react';

import { nearbyUnloadingPlacesUrl } from 'components/workplace_wizard/urls';
import { MapFeature, Point } from 'components/workplace_wizard/types';
import { Marker, Popup } from 'react-leaflet';
import * as L from 'leaflet';
import up_icon from './unloading.svg';
import sessionRequest from 'sessionRequest';
import { LatLngLiteral } from 'leaflet';
import { popupBtn, WWIcon } from 'components/workplace_wizard/util_components';
import { ImageButton } from 'components/workplace_wizard/ImageButton';

type UnloadingPlacesMapLayerProps = {
  location: Point;
  addUP: any;
};

type UnloadingPlacesMapLayerState = {
  nearbyUnloadingPlaces?: MapFeature[];
};

const initialState: UnloadingPlacesMapLayerState = {};

const size = 20;
const icon = L.divIcon({
  className: 'mapIcon discrete',
  html: `<img src="${up_icon}"/>`,
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

export default class UnloadingPlacesMapLayer extends React.Component<
  UnloadingPlacesMapLayerProps,
  UnloadingPlacesMapLayerState
> {
  state = initialState;

  render() {
    const { addUP } = this.props;
    const { nearbyUnloadingPlaces } = this.state;
    return (
      (nearbyUnloadingPlaces &&
        nearbyUnloadingPlaces.map((unloadingPlace) => (
          <Marker
            key={unloadingPlace.id}
            position={this.latLng(unloadingPlace)}
            icon={icon}
            zIndexOffset={-1000}
          >
            <Popup closeOnClick={true} closeButton={false} className="wwPopup">
              <ImageButton f={unloadingPlace} />
              {addUP ? (
                <button className={popupBtn} onClick={() => addUP(unloadingPlace)}>
                  <WWIcon icon="local_shipping" outline /> Yhdistä
                </button>
              ) : (
                <div className="p-2 font-weight-bold">Luo sisäänkäynti ensin!</div>
              )}
            </Popup>
          </Marker>
        ))) ||
      null
    );
  }

  componentDidMount() {
    this.loadNearbyUnloadingPlaces();
  }

  componentDidUpdate(prevProps: Readonly<UnloadingPlacesMapLayerProps>) {
    const { lat, lon } = prevProps.location,
      l = this.props.location;
    if (l.lat != lat || l.lon != lon) this.loadNearbyUnloadingPlaces();
  }

  loadNearbyUnloadingPlaces() {
    const { lon, lat } = this.props.location;
    if (!(lon && lat)) return;
    sessionRequest(nearbyUnloadingPlacesUrl({ lon, lat }))
      .then((response) => response.json())
      .then((nearbyUnloadingPlaces) => this.setState({ nearbyUnloadingPlaces }));
  }

  private latLng(feature: MapFeature) {
    const { lat, lon } = feature || {};
    const latLng = { lng: lon, lat } as LatLngLiteral;
    return latLng;
  }
}
