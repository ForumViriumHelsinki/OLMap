import React from "react";
import _ from "lodash";
import { MapFeature, OSMImageNote } from "components/types";
// @ts-ignore
import { Button } from "reactstrap";
import Modal from "util_components/bootstrap/Modal";
import { SimpleOSMImageNotesMap } from "components/osm_image_notes/OSMImageNotesMap";
import { Location, LocationTuple } from "util_components/types";
import sessionRequest from "sessionRequest";
import {
  osmImageNoteUrl,
  unloadingPlaceUrl,
  workplaceEntrancesUrl,
  workplaceEntranceUrl,
} from "urls";
import Map from "util_components/Map";
import * as L from "leaflet";
import { LatLngLiteral } from "leaflet";
// @ts-ignore

type UnloadingPlaceAccessPointsProps = {
  osmImageNote: OSMImageNote;
  unloadingPlace: MapFeature;
};

type UnloadingPlaceAccessPointsState = {
  open: boolean;
};

const initialState: UnloadingPlaceAccessPointsState = {
  open: false,
};

const markerColor = "#007bff";
const markerStyle = {
  radius: 2,
  color: markerColor,
  opacity: 0.05,
  weight: 20,
  fillColor: markerColor,
  fillOpacity: 1,
  bubblingMouseEvents: false,
};

export default class UnloadingPlaceAccessPoints extends React.Component<
  UnloadingPlaceAccessPointsProps,
  UnloadingPlaceAccessPointsState
> {
  state: UnloadingPlaceAccessPointsState = initialState;

  static defaultProps = {
    osmImageNote: {},
  };

  render() {
    const { osmImageNote, unloadingPlace } = this.props;
    const { open } = this.state;

    if (!unloadingPlace.access_points) unloadingPlace.access_points = [];
    const nrOfPoints = unloadingPlace.access_points.length;

    const latLng = [osmImageNote.lat, osmImageNote.lon] as LocationTuple;

    return (
      <div className="mt-1">
        {nrOfPoints > 0 ? `${nrOfPoints} access points. ` : ""}
        <Button
          size="sm"
          color="primary"
          outline
          className="btn-compact"
          onClick={() => this.setState({ open: true })}
        >
          Edit access points
        </Button>
        {open && (
          <Modal
            onClose={() => this.setState({ open: false })}
            title="Edit unloading place access points"
          >
            <div className="p-2">
              Tap to add / remove points ({nrOfPoints} active):
            </div>
            <div style={{ height: 400 }}>
              <Map
                latLng={latLng}
                extraLayers={[this.getMapLayer()]}
                zoom={19}
                onClick={this.addPoint}
              />
            </div>
            <div className="p-2">
              <button
                className="btn btn-primary btn-block"
                onClick={() => this.setState({ open: false })}
              >
                Done
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  getMapLayer() {
    const { unloadingPlace } = this.props;
    const mapLayer = L.layerGroup();

    if (!unloadingPlace.access_points) unloadingPlace.access_points = [];

    unloadingPlace.access_points.forEach(
      (accessPoint: Location, index: number) => {
        const latLng = {
          lng: accessPoint.lon,
          lat: accessPoint.lat,
        } as LatLngLiteral;
        const marker = L.circleMarker(latLng, markerStyle);
        marker.on("click", (e: any) => {
          this.removePoint(index);
        });
        marker.addTo(mapLayer);
      },
    );

    return mapLayer;
  }

  removePoint(index: number) {
    const { unloadingPlace } = this.props;
    unloadingPlace.access_points.splice(index, 1);
    this.savePoints();
  }

  savePoints() {
    const { unloadingPlace } = this.props;
    const url = unloadingPlaceUrl(unloadingPlace.id as number);
    sessionRequest(url, {
      method: "PATCH",
      data: { access_points: unloadingPlace.access_points },
    }).then((response) => {
      if (response.status < 300) {
        response.json().then((data) => {
          Object.assign(unloadingPlace, data);
          this.forceUpdate();
        });
      }
    });
  }

  addPoint = (latLng: LocationTuple) => {
    const { unloadingPlace } = this.props;
    const [lat, lon] = latLng;
    unloadingPlace.access_points.push({ lat, lon });
    this.savePoints();
  };
}
