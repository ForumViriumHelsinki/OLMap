import React from 'react';
import { osmAddressString, OSMFeature } from 'util_components/osm/types';
import { OSMImageNote } from 'components/types';
import Icon from 'util_components/bootstrap/Icon';
import OSMFeatureList from 'util_components/osm/OSMFeatureList';
import { LocationTuple } from 'util_components/types';

type OSMImageNoteAddressProps = {
  note: OSMImageNote;
  nearbyAddresses: OSMFeature[];
  saveAddresses: (addressIds: number[]) => any;
  readOnly?: boolean;
};

type OSMImageNoteAddressState = {
  editing: boolean;
};

const initialState: OSMImageNoteAddressState = {
  editing: false,
};

export default class OSMImageNoteAddress extends React.Component<
  OSMImageNoteAddressProps,
  OSMImageNoteAddressState
> {
  state = initialState;

  render() {
    const { note, nearbyAddresses, saveAddresses, readOnly } = this.props;
    const { lon, lat } = note;
    const addresses = note.addresses || [];
    const { editing } = this.state;
    const locationTuple = [lon, lat] as LocationTuple;
    return (
      <>
        <div className="list-group-item">
          {!readOnly && (
            <button
              className="btn btn-light btn-sm rounded-pill float-right"
              onClick={() => this.setState({ editing: !editing })}
            >
              <Icon icon={editing ? 'close' : 'edit'} />
            </button>
          )}
          <strong>Address: </strong>
          {!editing &&
            (!addresses.length
              ? '-'
              : !nearbyAddresses.length
                ? 'Loading...'
                : addresses.map((addressId) => {
                    const address = nearbyAddresses.find((a) => a.id == addressId);
                    return (
                      address && (
                        <span key={addressId}>
                          {addressId != addresses[0] && ', '}
                          {osmAddressString(address.tags)}
                        </span>
                      )
                    );
                  }))}
        </div>
        {editing && (
          <OSMFeatureList
            location={locationTuple}
            selectedFeatureIds={addresses}
            showFilters={false}
            onChange={saveAddresses}
            OSMFeatures={nearbyAddresses}
          />
        )}
      </>
    );
  }
}
