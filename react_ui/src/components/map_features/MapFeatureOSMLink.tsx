import React from 'react';
import {AppContext, MapFeature, OSMEditContextType, OSMImageNote} from "components/types";
import {OSMFeature} from "util_components/osm/types";
import {osmApiCall, osmEditContext, osmFeatureLabel} from "util_components/osm/utils";
import {getDistance} from "geolib";
import {GeolibInputCoordinates} from "geolib/es/types";
import Icon from "util_components/bootstrap/Icon";
import OpenOSMChangesetModal from "util_components/osm/OpenOSMChangesetModal";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";

import CreateNode from "util_components/osm/api/CreateNode";
import UpdateNode from "util_components/osm/api/UpdateNode";
import OSMEntranceCreationModal from "components/map_features/OSMEntranceCreationModal";


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
  showOSMEntranceModal?: boolean
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
    const {showChangeset, error, showOSMEntranceModal} = this.state;

    const discrepantTags = osmFeature && mapFeature.as_osm_tags &&
      Object.keys({...mapFeature.as_osm_tags, ...osmFeature.tags})
        // @ts-ignore
        .filter(k => osmFeature.tags[k] != mapFeature.as_osm_tags[k]);

    const isWp = featureTypeName == 'Workplace';
    const isEntrance = featureTypeName == 'Entrance';
    const canAdd = !mapFeature.osm_feature && (isWp || isEntrance);

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
                <button className="btn btn-light btn-compact btn-sm ml-1" onClick={this.unlinkOsmFeature}>
                  <Icon icon="link_off"/>
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
        <OpenOSMChangesetModal onClose={() => this.setState({showChangeset: false})}
                               onCreated={osmFeature ? this.updateOSMNode : this.createOSMNode} />
      }
      {showOSMEntranceModal &&
        <OSMEntranceCreationModal osmImageNote={osmImageNote} osmContext={osmEditContext} entrance={mapFeature}
          onCreated={this.onOSMNodeCreated}
          onClose={() => this.setState({showOSMEntranceModal: false})}/>
      }
    </>
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
        (!f.tags['addr:street'] || (f.tags['addr:street'] == mapFeature.street)) &&
        (!f.tags['addr:housenumber'] || (f.tags['addr:housenumber'] == mapFeature.housenumber)) &&
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

  unlinkOsmFeature = () => {
    const {saveFeature, mapFeature} = this.props;
    // @ts-ignore
    mapFeature.osm_feature = null;
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
    if (osmEditContext && osmEditContext.changeset)
      if (this.props.osmFeature) this.updateOSMNode(osmEditContext);
      else this.createOSMNode(osmEditContext);
    else this.setState({showChangeset: true});
  };

  updateOSMNode = (osmContext: OSMEditContextType) => {
    const {osmFeature} = this.props;
    if (!osmContext.changeset || !this.tagsToSave || !osmFeature) return;
    const props = {changesetId: osmContext.changeset.id, node: osmFeature, tags: this.tagsToSave};
    osmApiCall(`node/${osmFeature.id}`, UpdateNode, props, osmContext)
      .then(({response, text}) => {
        if (!response.ok) return this.setState({error: text});

        osmFeature.tags = {...this.tagsToSave};
        this.tagsToSave = null;
        this.setState({error: undefined});
        this.forceUpdate();
      });
  };

  createOSMNode = (osmContext: OSMEditContextType) => {
    const {osmImageNote, featureTypeName} = this.props;
    if (!osmContext.changeset || !this.tagsToSave) return;
    if (featureTypeName == 'Entrance') return this.setState({showOSMEntranceModal: true});

    const {lat, lon} = osmImageNote;
    const props = {changesetId: osmContext.changeset.id, lat, lon, tags: this.tagsToSave};

    osmApiCall(`node/create`, CreateNode, props, osmContext)
    .then(({response, text}) => {
      if (!response.ok) throw new Error(text);
      const osmId = parseInt(text);
      return {id: osmId, lat, lon, type: 'node', tags: {...this.tagsToSave}} as OSMFeature;
    }).then(this.onOSMNodeCreated)
    .catch((error) => this.setState({error: error.message || error}));
  };

  onOSMNodeCreated = (osmNode: OSMFeature) => {
    const {osmImageNote, addNearbyFeature, mapFeature, saveFeature} = this.props;
    addNearbyFeature(osmNode);
    this.tagsToSave = null;
    if (!osmImageNote.osm_features) osmImageNote.osm_features = [];
    osmImageNote.osm_features.push(osmNode.id);
    mapFeature.osm_feature = osmNode.id;
    this.setState({showOSMEntranceModal: false});
    return saveFeature()
  }
}
