import React from 'react';
import _ from 'lodash';
import * as L from 'leaflet';

import MyPositionMap from 'util_components/MyPositionMap';
import Map from 'util_components/Map';
import { Location } from 'util_components/types';

import { ImageNotesContext, OSMImageNote } from 'components/types';
import { OSMChangeset } from 'util_components/osm/types';
import OSMChangesetMapLayer from 'util_components/osm/OSMChangesetMapLayer';
import { LatLngLiteral } from 'leaflet';
import { filterNotes } from 'components/osm_image_notes/utils';

const markerColors = {
  problem: '#ff0000',
  new: '#ff5000',
  accepted: '#b700ff',
  processed: '#007bff',
  reviewed: '#28a745',
};

type OSMImageNotesMapProps = {
  onNoteSelected: (note: OSMImageNote) => any;
  selectLocation?: (l: Location) => any;
  filters: any;
  osmChangeset?: OSMChangeset;
  location?: Location;
  zoom?: number;
  selectedNotes?: number[];
};

type OSMImageNotesMapState = {
  changesetLayer?: any;
};

const initialState: () => OSMImageNotesMapState = () => ({});

export default class OSMImageNotesMap extends React.Component<
  OSMImageNotesMapProps,
  OSMImageNotesMapState
> {
  state: OSMImageNotesMapState = initialState();

  static contextType = ImageNotesContext;

  private mapLayer?: any;
  private dotMarkers: { [id: string]: any } = {};

  render() {
    const { osmChangeset, selectLocation, location, zoom } = this.props;
    const { changesetLayer } = this.state;

    return (
      <>
        {osmChangeset && (
          <OSMChangesetMapLayer
            changeset={osmChangeset}
            onLayerReady={(changesetLayer) => this.setState({ changesetLayer })}
          />
        )}
        <MyPositionMap
          onLocationSelected={selectLocation}
          location={location}
          zoom={zoom}
          extraLayers={_.filter([this.getMapLayer(), changesetLayer])}
        />
      </>
    );
  }

  getMapLayer() {
    const { filters, onNoteSelected, selectedNotes } = this.props;
    const { osmImageNotes } = this.context;

    if (!this.mapLayer) this.mapLayer = L.layerGroup();
    if (!osmImageNotes) return this.mapLayer;
    const filteredImageNotes = filterNotes(filters, osmImageNotes);

    filteredImageNotes.forEach((osmImageNote: OSMImageNote) => {
      const id = String(osmImageNote.id);
      const category = (osmImageNote.tags || []).includes('Problem')
        ? 'problem'
        : osmImageNote.is_reviewed
          ? 'reviewed'
          : osmImageNote.is_processed
            ? 'processed'
            : osmImageNote.is_accepted
              ? 'accepted'
              : 'new';
      const style = {
        radius: 2,
        color: markerColors[category],
        opacity: selectedNotes && selectedNotes.includes(osmImageNote.id as number) ? 0.4 : 0.05,
        weight: 20,
        fillColor: markerColors[category],
        fillOpacity: 1,
      };
      const latLng = {
        lng: osmImageNote.lon,
        lat: osmImageNote.lat,
      } as LatLngLiteral;
      if (this.dotMarkers[id]) return this.dotMarkers[id].setStyle(style).setLatLng(latLng);

      const marker = L.circleMarker(latLng, style);
      marker.on('click', () => onNoteSelected(osmImageNote));
      marker.addTo(this.mapLayer);
      this.dotMarkers[id] = marker;
    });

    const index = _.keyBy(filteredImageNotes, 'id');
    Object.entries(this.dotMarkers)
      .filter(([id]) => !index[id])
      .forEach(([id, marker]) => {
        marker.remove();
        delete this.dotMarkers[id];
      });
    return this.mapLayer;
  }
}

export class SimpleOSMImageNotesMap extends OSMImageNotesMap {
  render() {
    const { selectLocation, location, zoom } = this.props;
    if (!location) return <></>;

    return (
      <Map latLng={[location.lat, location.lon]} extraLayers={[this.getMapLayer()]} zoom={zoom} />
    );
  }
}
