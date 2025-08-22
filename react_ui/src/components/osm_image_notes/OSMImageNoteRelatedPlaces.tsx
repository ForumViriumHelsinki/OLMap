import React from "react";
import { OSMFeature } from "util_components/osm/types";
import { OSMImageNote } from "components/types";
import Icon from "util_components/bootstrap/Icon";
import { LocationTuple } from "util_components/types";
import OSMFeaturesSelection from "util_components/osm/OSMFeaturesSelection";
import { osmFeatureLabel } from "util_components/osm/utils";

type OSMImageNoteRelatedPlacesProps = {
  note: OSMImageNote;
  savePlaces: (featureIds: number[]) => any;
  readOnly?: boolean;
  onFeaturesLoaded: (features: OSMFeature[]) => any;
};

type OSMImageNoteRelatedPlacesState = {
  editing: boolean;
  nearbyPlaces: OSMFeature[];
};

const initialState: OSMImageNoteRelatedPlacesState = {
  editing: false,
  nearbyPlaces: [],
};

export default class OSMImageNoteRelatedPlaces extends React.Component<
  OSMImageNoteRelatedPlacesProps,
  OSMImageNoteRelatedPlacesState
> {
  state = initialState;

  render() {
    const { note, savePlaces, readOnly, onFeaturesLoaded } = this.props;
    const { lon, lat } = note;
    const osm_features = note.osm_features || [];
    const { editing, nearbyPlaces } = this.state;
    const locationTuple = [lon, lat] as LocationTuple;
    return (
      <>
        <div className="list-group-item">
          {!readOnly && (
            <button
              className="btn btn-light btn-sm rounded-pill float-right"
              onClick={() => this.setState({ editing: !editing })}
            >
              <Icon icon={editing ? "close" : "edit"} />
            </button>
          )}
          <strong>Related places: </strong>
          {!editing &&
            (!osm_features.length
              ? "-"
              : !nearbyPlaces.length
                ? "Loading..."
                : osm_features.map((featureId) => {
                    const feature = nearbyPlaces.find((a) => a.id == featureId);
                    return (
                      feature && (
                        <span key={featureId}>
                          {featureId != osm_features[0] && ", "}
                          {osmFeatureLabel(feature)}
                        </span>
                      )
                    );
                  }))}
        </div>
        <div style={editing ? {} : { display: "none" }}>
          <OSMFeaturesSelection
            location={locationTuple}
            onChange={savePlaces}
            maxHeight={null}
            preselectedFeatureIds={osm_features.filter((f) => f)}
            onFeaturesLoaded={this.onFeaturesLoaded}
          />
        </div>
      </>
    );
  }

  onFeaturesLoaded = (nearbyPlaces: OSMFeature[]) => {
    this.setState({ nearbyPlaces });
    this.props.onFeaturesLoaded(nearbyPlaces);
  };
}
