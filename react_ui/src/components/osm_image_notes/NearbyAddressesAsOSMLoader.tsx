import React from 'react';
// @ts-ignore
import _ from 'lodash';
import { LocationTuple } from 'util_components/types';
import { OSMFeature } from 'util_components/osm/types';
import sessionRequest from 'sessionRequest';
import { nearbyAddressesUrl } from 'urls';

type NearbyAddressesAsOSMLoaderProps = {
  location: LocationTuple;
  onLoad: (addresses: OSMFeature[]) => any;
};

type NearbyAddressesAsOSMLoaderState = {};

const initialState: NearbyAddressesAsOSMLoaderState = {};

export default class NearbyAddressesAsOSMLoader extends React.Component<
  NearbyAddressesAsOSMLoaderProps,
  NearbyAddressesAsOSMLoaderState
> {
  state = initialState;

  componentDidMount() {
    this.fetchAddresses();
  }

  render() {
    return '';
  }

  fetchAddresses = () => {
    const { location, onLoad } = this.props;
    return sessionRequest(nearbyAddressesUrl(location))
      .then((response) => response.json())
      .then((addresses) =>
        onLoad(addresses.map((a: any) => _.merge(a, { tags: { source: 'OLMap' } }))),
      );
  };
}
