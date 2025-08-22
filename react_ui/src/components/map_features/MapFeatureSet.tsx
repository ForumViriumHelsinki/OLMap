import React from "react";

import {
  AppContext,
  JSONSchema,
  MapFeature,
  OSMImageNote,
  WorkplaceEntrance,
} from "components/types";
// @ts-ignore
import { Button } from "reactstrap";
import { OSMFeature } from "util_components/osm/types";
import { userCanEditNote } from "components/osm_image_notes/utils";
import MapFeatureEditor from "components/map_features/MapFeatureEditor";

type MapFeatureSetProps = {
  schema: JSONSchema;
  onSubmit: (data: any) => any;
  featureTypeName: string;
  osmImageNote: OSMImageNote;
  nearbyFeatures: OSMFeature[];
  refreshNote?: () => any;
  addNearbyFeature: (f: OSMFeature) => any;
};

type MapFeatureSetState = {};

const initialState: MapFeatureSetState = {};

export default class MapFeatureSet extends React.Component<
  MapFeatureSetProps,
  MapFeatureSetState
> {
  state: MapFeatureSetState = initialState;

  static contextType = AppContext;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: [],
  };

  render() {
    const {
      schema,
      featureTypeName,
      osmImageNote,
      refreshNote,
      onSubmit,
      nearbyFeatures,
      addNearbyFeature,
    } = this.props;
    const { user } = this.context;
    // @ts-ignore
    const mapFeatures = (osmImageNote[this.getFeatureListFieldName()] ||
      []) as MapFeature[];
    const editable =
      userCanEditNote(user, osmImageNote) && mapFeatures.length == 0;
    const osmFeatureIndex = Object.fromEntries(
      nearbyFeatures.map((f) => [f.id, f]),
    );

    return (
      <>
        {mapFeatures.map((mapFeature, i) => (
          <MapFeatureEditor
            {...{
              key: mapFeature.id,
              featureTypeName,
              mapFeature,
              onSubmit,
              schema,
              refreshNote,
              osmImageNote,
              nearbyFeatures,
              osmFeature: mapFeature.osm_feature
                ? osmFeatureIndex[mapFeature.osm_feature]
                : undefined,
              onDelete: () => this.forceUpdate(),
              addNearbyFeature,
            }}
          />
        ))}

        {editable && (
          <div className="list-group-item">
            <Button
              size="sm"
              color="primary"
              outline
              className="btn-compact"
              onClick={this.newMapFeature}
            >
              New {featureTypeName}
            </Button>
          </div>
        )}
      </>
    );
  }

  newMapFeature = () => {
    const { osmImageNote, nearbyFeatures, schema, featureTypeName } =
      this.props;
    const listFieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const mapFeatures = (osmImageNote[listFieldName] || []) as MapFeature[];
    const selectedFeatureIds = (osmImageNote.osm_features || []).concat(
      osmImageNote.addresses || [],
    );
    const selectedFeatures = nearbyFeatures.filter((f) =>
      selectedFeatureIds.includes(f.id),
    );

    const newMapFeature: MapFeature = {};

    if (schema.properties.street && schema.properties.housenumber) {
      const f = selectedFeatures.find(
        (f) => f.tags["addr:housenumber"] && f.tags["addr:street"],
      );
      if (f) {
        newMapFeature.street = f.tags["addr:street"];
        newMapFeature.housenumber = f.tags["addr:housenumber"];
      }
    }

    if (schema.properties.name) {
      const f = selectedFeatures.find((f) => f.tags["name"]);
      if (f) {
        newMapFeature.name = f.tags["name"];
      }
    }

    if (featureTypeName == "Workplace") newMapFeature.workplace_entrances = [];

    mapFeatures.push(newMapFeature);
    // @ts-ignore
    osmImageNote[listFieldName] = mapFeatures;
    this.setState({ editingFeature: newMapFeature });
  };

  private getFeatureListFieldName() {
    return `${this.props.featureTypeName.toLowerCase()}_set`;
  }
}
