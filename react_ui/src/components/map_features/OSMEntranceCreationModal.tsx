import React from "react";
import Modal, { ModalBody } from "util_components/bootstrap/Modal";
import OSMEntranceCreator from "util_components/osm/OSMEntranceCreator";
import { Location } from "util_components/types";
import { MapFeature, OSMEditContextType, OSMImageNote } from "components/types";
import { OSMFeature } from "util_components/osm/types";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import Map from "util_components/Map";
import { CircleMarker, Polyline } from "react-leaflet";
import { LatLngExpression } from "leaflet";

type OSMEntranceCreationModalProps = {
  onClose: () => any;
  onCreated: (entrance: OSMFeature) => any;
  osmImageNote: OSMImageNote;
  entrance: MapFeature;
  osmContext: OSMEditContextType;
};

type OSMEntranceCreationModalState = {
  entranceCreator?: OSMEntranceCreator;
  error?: string;
  createWay: boolean;
};

const initialState: OSMEntranceCreationModalState = {
  createWay: true,
};

const green = "#28a745";

export default class OSMEntranceCreationModal extends React.Component<
  OSMEntranceCreationModalProps,
  OSMEntranceCreationModalState
> {
  state = initialState;

  render() {
    const { onClose } = this.props;
    const { error, entranceCreator, createWay } = this.state;
    // @ts-ignore
    const [lon, lat] = entranceCreator
      ? entranceCreator.entrancePoint.geometry.coordinates
      : [];
    const { accessPoint } = entranceCreator || {};
    const accessLatLng =
      accessPoint &&
      ([...accessPoint.geometry.coordinates].reverse() as LatLngExpression);

    const road = entranceCreator && entranceCreator.newRoadGeometry();
    const building = entranceCreator && entranceCreator.newBuildingGeometry();
    const wayType = this.getEntrancePathTags().highway;

    return (
      <Modal onClose={onClose} title="Create OSM entrance">
        <ModalBody>
          {error && <ErrorAlert message={error} status />}
          {!entranceCreator ? (
            "Loading..."
          ) : (
            <>
              <Map latLng={[lat, lon]} height="50vh" zoom={21}>
                {building && <Polyline positions={building} color="#aaa" />}
                {road && createWay && (
                  <>
                    <Polyline positions={road} color="#aaa" weight={5} />
                    <Polyline positions={road} color="#fff" weight={3} />
                  </>
                )}
                <CircleMarker
                  center={[lat, lon]}
                  radius={4}
                  fill
                  fillOpacity={1}
                  color={green}
                />
                {accessLatLng && createWay && (
                  <>
                    <CircleMarker
                      center={accessLatLng}
                      radius={4}
                      fill
                      fillOpacity={1}
                      color={green}
                    />
                    <Polyline
                      positions={[[lat, lon], accessLatLng]}
                      color={green}
                    />
                  </>
                )}
              </Map>
              <div className="mt-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => this.setState({ createWay: !createWay })}
                >
                  {createWay ? "Omit" : "Create"} {wayType}{" "}
                  {wayType == "service" ? "road" : ""}
                </button>
                <button
                  className="btn btn-primary btn-sm ml-2"
                  onClick={this.createOSMEntrance}
                >
                  Save to OSM
                </button>
              </div>
            </>
          )}
        </ModalBody>
      </Modal>
    );
  }

  componentDidMount() {
    this.prepareEntranceAddition();
  }

  prepareEntranceAddition() {
    const { osmImageNote, entrance } = this.props;
    new OSMEntranceCreator(osmImageNote as Location, entrance.layer)
      .findPointsToAdd()
      .then((entranceCreator) => this.setState({ entranceCreator }));
  }

  createOSMEntrance = () => {
    const { osmContext, entrance, onCreated } = this.props;
    const { entranceCreator, createWay } = this.state;
    if (!osmContext.changeset || !entrance.as_osm_tags || !entranceCreator)
      return;

    entranceCreator
      .createEntrance(
        osmContext,
        entrance.as_osm_tags,
        createWay && this.getEntrancePathTags(),
      )
      .then(onCreated)
      .catch((error) => this.setState({ error: error.message || error }));
  };

  getEntrancePathTags() {
    const { osmImageNote, entrance } = this.props;
    // @ts-ignore
    const steps = (osmImageNote.steps_set || [])[0];
    const pathType = entrance.type == "garage" ? "service" : "footway";

    if (steps) return steps.as_osm_tags;
    return { highway: pathType, access: entrance.access || "destination" };
  }
}
