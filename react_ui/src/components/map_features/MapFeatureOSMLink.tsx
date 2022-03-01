import React from 'react';
import {AppContext, MapFeature, OSMEditContextType, OSMImageNote} from "components/types";
import {OSMFeature} from "util_components/osm/types";
import {osmApiCall, osmEditContext, osmFeatureLabel} from "util_components/osm/utils";
import {getDistance} from "geolib";
import {GeolibInputCoordinates} from "geolib/es/types";
import Icon from "util_components/bootstrap/Icon";
import OpenOSMChangesetModal from "util_components/osm/OpenOSMChangesetModal";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import OSMEntranceCreator from "util_components/osm/OSMEntranceCreator";
import {Location} from "util_components/types";

import CreateNode from "util_components/osm/api/CreateNode";
import UpdateWay from "util_components/osm/api/UpdateWay";
import UpdateNode from "util_components/osm/api/UpdateNode";


type MapFeatureOSMLinkProps = {
  featureTypeName: string,
  osmImageNote: OSMImageNote,
  nearbyFeatures: OSMFeature[],
  mapFeature: MapFeature,
  osmFeature?: OSMFeature,
  saveFeature: () => any,
  addNearbyFeature: (f: OSMFeature) => any
}

type MapFeatureOSMLinkState = {
  showChangeset?: boolean,
  error?: string,
  entranceCreator?: OSMEntranceCreator
}

const initialState: MapFeatureOSMLinkState = {};

export default class MapFeatureOSMLink extends React.Component<MapFeatureOSMLinkProps, MapFeatureOSMLinkState> {
  state: MapFeatureOSMLinkState = initialState;

  static contextType = AppContext;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: []
  };

  tagsToSave: any = null;

  render() {
    const {osmImageNote, mapFeature, osmFeature, featureTypeName} = this.props;
    const {showChangeset, error, entranceCreator} = this.state;

    const discrepantTags = osmFeature && mapFeature.as_osm_tags &&
      Object.keys({...mapFeature.as_osm_tags, ...osmFeature.tags})
        // @ts-ignore
        .filter(k => osmFeature.tags[k] != mapFeature.as_osm_tags[k]);

    const isWp = featureTypeName == 'Workplace';
    const isEntrance = featureTypeName == 'Entrance';
    const canAddEntrance = isEntrance && entranceCreator && entranceCreator.entrancePoint;
    const canAdd = !mapFeature.osm_feature && (isWp || canAddEntrance);

    return <>
      {!osmFeature ?
        <table className="table table-bordered table-sm mt-2 mb-2">
          <tbody>
          <tr>
            <th colSpan={3}>
              OSM: {mapFeature.osm_feature ? mapFeature.osm_feature + ' (not found)' : 'Not linked'}
              <button className="btn btn-light btn-compact btn-sm ml-2" onClick={this.relinkOsmFeature}>
                <Icon icon="refresh"/>
              </button>
              {canAdd && <>
                <button className="btn btn-compact btn-sm btn-outline-primary mr-1" onClick={this.addToOSM}>
                  Add to OSM
                </button>
                <button className="btn btn-compact btn-sm btn-outline-secondary mr-1"
                        onClick={() => this.setState({showChangeset: true})}>
                  New changeset
                </button>
              </>}
            </th>
          </tr>
          </tbody>
        </table>
        : <>
          <table className="table table-bordered table-sm mt-2 mb-2">
            <tbody>
            <tr>
              <th colSpan={3}>
                OSM: <a href={`https://www.openstreetmap.org/${osmFeature.type}/${osmFeature.id}`} target="osm">
                {osmFeatureLabel(osmFeature)}
              </a>
                {osmFeature.type == 'node' &&
                <> ({getDistance(osmFeature, osmImageNote as GeolibInputCoordinates)}m)</>
                }
                <button className="btn btn-light btn-compact btn-sm ml-2" onClick={this.relinkOsmFeature}>
                  <Icon icon="refresh"/>
                </button>
              </th>
            </tr>
            {discrepantTags && discrepantTags.length > 0 && <>
              <tr>
                <th></th>
                <th>OLMap</th>
                <th>OSM</th>
              </tr>
              {discrepantTags.map(tag =>
                // @ts-ignore
                <tr key={tag}><th>{tag}</th><td>{mapFeature.as_osm_tags[tag]}</td><td>{osmFeature.tags[tag]}</td></tr>
              )}
            </>}
            </tbody>
          </table>

          {discrepantTags && discrepantTags.length > 0 &&
          <div className="mb-4">
            <button className="btn btn-compact btn-sm btn-outline-primary mr-1" onClick={this.addToOSM}>
              Add to OSM
            </button>
            <button className="btn btn-compact btn-sm btn-outline-danger mr-1" onClick={this.replaceOSM}>
              Replace OSM
            </button>
            <button className="btn btn-compact btn-sm btn-outline-secondary mr-1"
                    onClick={() => this.setState({showChangeset: true})}>
              New changeset
            </button>
          </div>
          }
        </>
      }
      {error && <ErrorAlert message={error} status/>}
      {showChangeset &&
        <OpenOSMChangesetModal onClose={() => this.setState({showChangeset: false})} onCreated={this._saveToOSM} />
      }
    </>
  }

  componentDidMount() {
    const {mapFeature, featureTypeName} = this.props;
    if (featureTypeName == 'Entrance' && !mapFeature.osm_feature)
      this.prepareEntranceAddition();
  }

  prepareEntranceAddition() {
    const {osmImageNote} = this.props;
    new OSMEntranceCreator(osmImageNote as Location).findPointsToAdd()
      .then(entranceCreator => this.setState({entranceCreator}));
  }

  linkOSMFeature() {
    const {osmImageNote, mapFeature, featureTypeName, nearbyFeatures} = this.props;
    let osmFeature;

    if (featureTypeName == "Workplace" && mapFeature.name) {
      osmFeature = nearbyFeatures.find(
        f => f.tags.name && f.tags.name.match(new RegExp(`^${mapFeature.name}$`, 'i')));
      if (!osmFeature)
        osmFeature = nearbyFeatures.find(
          f => f.tags.name && f.tags.name.search(new RegExp(mapFeature.name, 'i')) > -1);
    }

    if (featureTypeName == "Gate") {
      let gates = nearbyFeatures.filter((f) =>
        f.tags.barrier == 'gate' &&
        // @ts-ignore
        getDistance(osmImageNote, f) < 5);
      if (gates.length) {
        // @ts-ignore
        gates.sort((a, b) => getDistance(osmImageNote, a) - getDistance(osmImageNote, b));
        osmFeature = gates[0];
      }
    }

    if (featureTypeName == "Entrance") {
      let entrances = nearbyFeatures.filter((f) =>
        f.tags.entrance &&
        f.tags['addr:street'] == mapFeature.street &&
        f.tags['addr:housenumber'] == mapFeature.housenumber &&
        (f.tags['addr:unit'] || '') == mapFeature.unit &&
        // @ts-ignore
        getDistance(osmImageNote, f) < 5);

      if (!entrances.length) {
        // @ts-ignore
        entrances = nearbyFeatures.filter((f) => f.tags.entrance && getDistance(osmImageNote, f) < 2);
      }

      if (entrances.length) {
        // @ts-ignore
        entrances.sort((a, b) => getDistance(osmImageNote, a) - getDistance(osmImageNote, b));
        osmFeature = entrances[0];
      }
    }

    if (osmFeature) {
      const osmId = Number(osmFeature.id);
      if (!osmImageNote.osm_features) osmImageNote.osm_features = [];
      if (!osmImageNote.osm_features.includes(osmId)) osmImageNote.osm_features.push(osmId);
      mapFeature.osm_feature = osmId;
    }

    return osmFeature;
  }

  relinkOsmFeature = () => {
    const {saveFeature} = this.props;
    this.linkOSMFeature();
    saveFeature();
    this.forceUpdate();
  };

  addToOSM = () => {
    const {mapFeature, osmFeature} = this.props;
    if (!mapFeature.as_osm_tags) return;
    this.tagsToSave = osmFeature ? {...osmFeature.tags, ...mapFeature.as_osm_tags} : {...mapFeature.as_osm_tags};
    this.saveToOSM()
  };

  replaceOSM = () => {
    const {mapFeature, osmFeature} = this.props;
    if (!(mapFeature.as_osm_tags && osmFeature)) return;
    this.tagsToSave = {...mapFeature.as_osm_tags};
    this.saveToOSM()
  };

  saveToOSM = () => {
    if (osmEditContext && osmEditContext.changeset) this._saveToOSM(osmEditContext);
    else this.setState({showChangeset: true});
  };

  _saveToOSM = (osmContext: OSMEditContextType) => {
    const {osmFeature, osmImageNote, addNearbyFeature, mapFeature, saveFeature} = this.props;
    const {entranceCreator} = this.state;
    if (!osmContext.changeset || !this.tagsToSave) return;

    if (osmFeature) {
      const props = {changesetId: osmContext.changeset.id, node: osmFeature, tags: this.tagsToSave};
      osmApiCall(`node/${osmFeature.id}`, UpdateNode, props, osmContext)
      .then(({response, text}) => {
        if (response.ok) {
          osmFeature.tags = {...this.tagsToSave};
          this.tagsToSave = null;
          this.setState({error: undefined});
          this.forceUpdate();
        } else this.setState({error: text});
      });
    } else {
      // @ts-ignore
      const coords = entranceCreator && entranceCreator.entrancePoint.geometry.coordinates;
      const {lat, lon} = coords ? {lon: coords[0], lat: coords[1]} : osmImageNote;
      const props = {changesetId: osmContext.changeset.id, lat, lon, tags: this.tagsToSave};
      osmApiCall(`node/create`, CreateNode, props, osmContext)
      .then(({response, text}) => {
        if (response.ok) {
          const osmId = parseInt(text);
          const osmNode = {id: osmId, lat, lon, type: 'node', tags: {...this.tagsToSave}};
          // @ts-ignore
          addNearbyFeature(osmNode);
          this.tagsToSave = null;
          if (!osmImageNote.osm_features) osmImageNote.osm_features = [];
          osmImageNote.osm_features.push(osmId);
          mapFeature.osm_feature = osmId;
          this.setState({error: undefined});
          if (entranceCreator) return this.connectOSMEntrance(osmNode as OSMFeature)
        } else this.setState({error: text});
      }).then(() => saveFeature());
    }
  };

  connectOSMEntrance(entrance: OSMFeature) {
    const {entranceCreator} = this.state;
    if (!entranceCreator || !entranceCreator.building) return;
    const {building, entrancePoint} = entranceCreator;
    // @ts-ignore
    const {index} = entrancePoint.properties;
    (building.nodes as number[]).splice(index + 1, 0, entrance.id);
    const props = {changesetId: osmEditContext.changeset.id, way: building};
    return osmApiCall(`way/${entranceCreator.building.id}`, UpdateWay, props, osmEditContext)
      .then(({response, text}) => {
        if (response.ok) {
          this.setState({error: undefined});
        } else this.setState({error: text});
      })
  }
}
