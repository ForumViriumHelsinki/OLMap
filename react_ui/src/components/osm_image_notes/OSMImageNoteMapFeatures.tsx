import React from "react";
import MapFeatureSet from "components/map_features/MapFeatureSet";
import { MapFeatureTypes, OSMImageNote } from "components/types";
import { OSMFeature } from "util_components/osm/types";

type OSMImageNoteMapFeaturesProps = {
  mapFeatureTypes: MapFeatureTypes;
  osmImageNote: OSMImageNote;
  nearbyFeatures: OSMFeature[];
  refreshNote: () => any;
  addNearbyFeature: (f: OSMFeature) => any;
  onSubmit: (data: any) => any;
};

type OSMImageNoteMapFeaturesState = {};

const initialState: OSMImageNoteMapFeaturesState = {};

export default class OSMImageNoteMapFeatures extends React.Component<
  OSMImageNoteMapFeaturesProps,
  OSMImageNoteMapFeaturesState
> {
  state = initialState;

  render() {
    const {
      osmImageNote,
      nearbyFeatures,
      mapFeatureTypes,
      refreshNote,
      onSubmit,
      addNearbyFeature,
    } = this.props;
    const {} = this.state;
    return this.getRelevantFeatureTypes().map((featureTypeName) => (
      <div key={featureTypeName}>
        <MapFeatureSet
          {...{
            osmImageNote,
            featureTypeName,
            nearbyFeatures,
            refreshNote,
            onSubmit,
            addNearbyFeature,
          }}
          schema={mapFeatureTypes[featureTypeName]}
        />
      </div>
    ));
  }

  private getRelevantFeatureTypes() {
    const { mapFeatureTypes, osmImageNote } = this.props;
    const tags = osmImageNote.tags || [];
    const allTags = Object.keys(mapFeatureTypes || {});
    return allTags.filter((tag) => tags.includes(tag));
  }
}
