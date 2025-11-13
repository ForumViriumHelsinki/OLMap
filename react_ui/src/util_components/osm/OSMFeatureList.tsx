import React from "react";
// @ts-ignore
import _ from "lodash";

import { LocationTuple } from "util_components/types";
import { getDistance } from "geolib";
import { GeolibInputCoordinates } from "geolib/es/types";
// @ts-ignore
import { ListGroup, ListGroupItem } from "reactstrap";
import PillsSelection from "util_components/PillsSelection";
import Toggle from "util_components/Toggle";
import { OSMFeature, osmFeatureTypes } from "util_components/osm/types";
import OSMFeatureMapPopup from "util_components/osm/OSMFeatureMapPopup";
import { osmFeatureLabel } from "util_components/osm/utils";

type sortOption = "relevance" | "distance" | "name";
const sortOptions: sortOption[] = ["distance", "relevance", "name"];

type filterOption = "entrance" | "place" | "address" | "street" | "barrier";
const filterOptions: filterOption[] = [
  "entrance",
  "place",
  "address",
  "street",
  "barrier",
];

const filters: { [key: string]: (f: OSMFeature) => boolean | null } = {
  entrance: (f) => Boolean(f.tags.entrance),
  place: (f) => Boolean(f.tags.name && f.type != "way"),
  address: (f) =>
    Boolean(f.tags["addr:housenumber"] && !f.tags.name && !f.tags.entrance),
  street: (f) => Boolean(f.type == "way"),
  barrier: (f) => Boolean(f.tags.barrier),
};

type OSMFeatureListProps = {
  location: LocationTuple;
  OSMFeatures: OSMFeature[];
  onChange: (featureIds: number[]) => any;
  selectedFeatureIds: number[];
  readOnly?: boolean;
  featureActions?: (feature: OSMFeature) => any;
  showFilters: boolean;
};

type OSMFeatureListState = {
  sortBy: sortOption;
  selectedFilters: filterOption[];
  featureMap?: OSMFeature;
};

const initialState: OSMFeatureListState = {
  sortBy: sortOptions[0],
  selectedFilters: [],
};

export default class OSMFeatureList extends React.Component<
  OSMFeatureListProps,
  OSMFeatureListState
> {
  state = initialState;
  static defaultProps = { showFilters: true };

  render() {
    const { sortBy, selectedFilters, featureMap } = this.state;
    const selectedFeatures = this.selectedFeatures();
    const {
      OSMFeatures,
      selectedFeatureIds,
      readOnly,
      featureActions,
      location,
      showFilters,
    } = this.props;

    return (
      <ListGroup>
        {readOnly ? (
          selectedFeatures.length ? (
            selectedFeatures.map((osmFeature: any, i) => (
              <ListGroupItem key={i}>
                {featureActions && featureActions(osmFeature)}
                <OSMFeatureMapPopup
                  osmFeature={osmFeature}
                  location={location}
                />
                {this.label(osmFeature)}
              </ListGroupItem>
            ))
          ) : (
            <ListGroupItem>No places selected</ListGroupItem>
          )
        ) : (
          <>
            {OSMFeatures.length > 5 && showFilters && (
              <ListGroupItem className="pt-1 pt-sm-2">
                <span className="d-inline-block mt-2 mt-sm-0">
                  Filter:{" "}
                  <PillsSelection
                    options={filterOptions}
                    selected={selectedFilters}
                    color="secondary"
                    onClick={this.toggleFilter}
                  />
                </span>
                <span className="d-inline-block ml-1">
                  <Toggle off="Sort" on="Sort by: ">
                    <PillsSelection
                      options={sortOptions}
                      selected={[sortBy]}
                      color="secondary"
                      onClick={this.sortBy}
                    />
                  </Toggle>
                </span>
              </ListGroupItem>
            )}
            {this.getOSMFeatures().map((osmFeature: any, i: number) => (
              <ListGroupItem
                key={i}
                active={selectedFeatureIds.includes(osmFeature.id)}
                onClick={() => this.toggleSelectedFeature(osmFeature)}
              >
                {featureActions && featureActions(osmFeature)}

                <OSMFeatureMapPopup
                  osmFeature={osmFeature}
                  location={location}
                />
                {this.label(osmFeature)}
              </ListGroupItem>
            ))}
          </>
        )}
      </ListGroup>
    );
  }

  sortBy = (opt: string) => {
    const sortBy = opt as sortOption;
    this.setState({ sortBy });
  };

  toggleFilter = (f: string) => {
    const { selectedFilters } = this.state;
    const filter = f as filterOption;
    if (selectedFilters.includes(filter))
      this.setState({ selectedFilters: [] });
    else this.setState({ selectedFilters: [filter] });
  };

  selectedFeatures() {
    return this.props.OSMFeatures.filter((f) =>
      this.props.selectedFeatureIds.includes(f.id),
    );
  }

  private label(osmFeature: OSMFeature) {
    const { location } = this.props;
    let label = osmFeatureLabel(osmFeature);
    if (osmFeature.type == "node")
      label += ` (${getDistance(
        osmFeature,
        location as GeolibInputCoordinates,
      )}m)`;
    return label;
  }

  private toggleSelectedFeature(osmFeature: OSMFeature) {
    const { onChange } = this.props;
    const selectedFeatureIds = this.props.selectedFeatureIds.slice();
    const index = selectedFeatureIds.indexOf(osmFeature.id);
    if (index == -1) selectedFeatureIds.push(osmFeature.id);
    else selectedFeatureIds.splice(index, 1);
    onChange(selectedFeatureIds);
  }

  private getOSMFeatures() {
    const { sortBy, selectedFilters } = this.state;
    const { location, OSMFeatures } = this.props;

    const sortFn = {
      name: (f: OSMFeature) => this.label(f),
      distance: (f: OSMFeature) =>
        f.type == "node"
          ? getDistance(f, location as GeolibInputCoordinates)
          : 40,
      relevance: (f: OSMFeature) => {
        for (const i in osmFeatureTypes)
          if (f.tags[osmFeatureTypes[i].requiredTag]) return i;
        return osmFeatureTypes.length;
      },
    }[sortBy];
    const features = selectedFilters.length
      ? OSMFeatures.filter((f) =>
          _.some(selectedFilters.map((filter) => filters[filter](f))),
        )
      : OSMFeatures;
    return _.sortBy(features, sortFn);
  }
}
