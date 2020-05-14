import React from 'react';

// @ts-ignore
import * as L from 'leaflet';
// @ts-ignore
import _ from 'lodash';

import {Package} from "components/types";
import LiveDataLoader from "util_components/LiveDataLoader";
import Map from "util_components/Map";
import GlyphIcon from "util_components/GlyphIcon";

import {availablePackagesUrl, myPackagesUrl} from "urls";
import Modal from "util_components/bootstrap/Modal";
import InTransitPackage from "components/package_cards/InTransitPackage";
import AvailablePackage from "components/package_cards/AvailablePackage";

type LivePackagesMapProps = {}

type LivePackagesMapState = {
  availablePackages?: Package[],
  pendingPackages?: Package[],
  selectedPackage?: Package,
  mapLayer: any
}

const initialState: () => LivePackagesMapState = () => ({
  mapLayer: L.layerGroup()
});

type markerIndex = { [id: string]: any };

export default class LivePackagesMap extends React.Component<LivePackagesMapProps, LivePackagesMapState> {
  state = initialState();

  map: any = undefined;
  userMovedMap = false;

  pendingMarkers: markerIndex = {};
  availableMarkers: markerIndex = {};

  loaders = {
    available: React.createRef<LiveDataLoader>(),
    pending: React.createRef<LiveDataLoader>()
  };

  packageIndex: {[id: string]: Package} = {};

  render() {
    const {} = this.props;
    const {mapLayer, selectedPackage} = this.state;
    return <>
      <LiveDataLoader url={availablePackagesUrl}
                      ref={this.loaders.available}
                      onLoad={(availablePackages) => {
                        this.setState({availablePackages});
                        this.updateMapLayer()}}/>
      <LiveDataLoader url={myPackagesUrl}
                      ref={this.loaders.pending}
                      onLoad={(pendingPackages) => {
                        this.setState({pendingPackages});
                        this.updateMapLayer()}}/>
      <div className="mt-2" style={{height: window.innerHeight - 160}}>
        <Map extraLayers={[mapLayer]} onMapInitialized={this.setMap}/>
      </div>
      {selectedPackage &&
        <Modal onClose={() => this.setState({selectedPackage: undefined})} title="">
          {selectedPackage.courier ?
            <InTransitPackage package={selectedPackage} onPackageUpdate={this.packageUpdated}/>
          : <AvailablePackage package={selectedPackage} onPackageUpdate={this.packageUpdated}/>
          }
        </Modal>
      }
    </>;
  }

  packageUpdated = (item: Package) => {
    Object.values(this.loaders)
    .forEach(loaderRef => loaderRef.current && loaderRef.current.refreshItems())
    this.setState({selectedPackage: item});
  };

  setMap = (map: any) => {
    this.map = map;
    this.map.on('zoomstart', () => this.userMovedMap = true);
    this.map.on('movestart', () => this.userMovedMap = true);
  };

  private updateMapLayer() {
    const {mapLayer, availablePackages, pendingPackages, selectedPackage} = this.state;

    if (!availablePackages || !pendingPackages) return;

    const packages = availablePackages.concat(pendingPackages);
    this.packageIndex = _.keyBy(packages, 'id');

    [{packages: availablePackages, markers: this.availableMarkers, glyph: 'add', opacity: 0.2},
     {packages: pendingPackages, markers: this.pendingMarkers, glyph: 'check', opacity: 0.7}]
    .forEach(({packages, markers, glyph, opacity}) => {
      packages.forEach((item: Package) => {
        if (!markers[item.id]) {
          markers[item.id] = L.layerGroup().addTo(mapLayer);

          L.marker(
            [item.deliver_to.lat, item.deliver_to.lon],
            {icon: new GlyphIcon({glyph, glyphSize: 20})})
            .addTo(markers[item.id])
            .on('click', () => this.setState({selectedPackage: this.packageIndex[item.id]}));

          L.polyline([[item.pickup_at.lat, item.pickup_at.lon],
            [item.deliver_to.lat, item.deliver_to.lon]], {opacity})
            .addTo(markers[item.id]);
        }
      });

      const packageIndex = _.keyBy(packages, 'id');
      Object.keys(markers)
      .filter(id => !packageIndex[id])
      .forEach(id => {markers[id].remove(); delete markers[id] });
    });

    if (!packages.length) return;

    const lats = packages.map(p => p.deliver_to.lat).concat(packages.map(p => p.pickup_at.lat));
    const lons = packages.map(p => p.deliver_to.lon).concat(packages.map(p => p.pickup_at.lon));
    const bounds = [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]];

    if (this.map && !this.userMovedMap) {
      this.map.fitBounds(bounds);
      // Clumsy way to ensure that fitting the map to the bounds is not itself
      // counted as the user moving the map:
      setTimeout(() => this.userMovedMap = false, 2000);
    }
  }
}
