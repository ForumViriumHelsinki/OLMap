import React from "react";
// @ts-ignore
import * as L from "leaflet";
import "mapbox-gl-leaflet";
import settings from "../settings.js";

import "leaflet/dist/leaflet.css";
import { LocationTuple } from "util_components/types";
import Icon from "util_components/bootstrap/Icon";
import { Map as LeafletMap } from "react-leaflet";
import { LatLngTuple } from "leaflet";
import TunnelsMapLayer from "components/workplace_wizard/TunnelsMapLayer";

type MapProps = {
  onMapInitialized?: (leafletMap: any) => any;
  latLng: LocationTuple;
  zoom: number;
  extraLayers?: any[];
  showAttribution: boolean;
  zoomControl: boolean;
  onClick?: (latLng: LocationTuple) => any;
  backgroundChangeable: boolean;
  height: any;
};

let idCounter = 0;

type bgType = "orthophoto" | "osm" | "tunnels";
type MapState = {
  background: bgType;
};

const initialState: MapState = {
  background: "osm",
};

export default class Map extends React.Component<MapProps, MapState> {
  private leafletMap: any = null;
  private bgLayer: any = null;
  private id = idCounter++;

  state = { ...initialState };

  static defaultProps = {
    zoom: 18,
    latLng: settings.defaultLocation,
    showAttribution: true,
    zoomControl: true,
    backgroundChangeable: false,
    height: "100%",
  };

  render() {
    const {
      backgroundChangeable,
      children,
      latLng,
      zoom,
      showAttribution,
      zoomControl,
      height,
    } = this.props;
    const { background } = this.state;
    return (
      <>
        <LeafletMap
          style={{ height }}
          center={latLng as LatLngTuple}
          zoom={zoom}
          whenCreated={(map: L.Map) => {
            this.leafletMap = map;
            this.refreshMap();
          }}
          attributionControl={showAttribution}
          zoomControl={zoomControl}
          preferCanvas
        >
          {children}
          {background == "tunnels" && <TunnelsMapLayer />}
        </LeafletMap>
        {backgroundChangeable && (
          <button
            style={{ marginTop: -64, position: "relative", zIndex: 400 }}
            className="btn btn-outline-primary ml-2 btn-sm bg-white"
            onClick={this.switchBackground}
          >
            <Icon icon="layers" />
          </button>
        )}
      </>
    );
  }

  componentDidUpdate(prevProps?: Readonly<MapProps>) {
    if (prevProps && prevProps.extraLayers)
      prevProps.extraLayers.forEach((layer) => {
        if (!this.props.extraLayers?.includes(layer)) layer.remove();
      });
    this.refreshMap();
  }

  refreshMap() {
    if (!this.leafletMap) return;
    const { extraLayers, onMapInitialized, onClick } = this.props;
    const newMap = !this.bgLayer;

    if (!this.bgLayer) {
      this.initBgLayer(this.state.background);

      if (onClick) {
        this.leafletMap.on("click", (e: any) => {
          onClick([e.latlng.lat, e.latlng.lng]);
        });
      }

      if (onMapInitialized) onMapInitialized(this.leafletMap);
    }
    if (extraLayers)
      extraLayers.forEach((mapLayer) => {
        if (!this.leafletMap.hasLayer(mapLayer)) {
          mapLayer.addTo(this.leafletMap);
          if (!newMap && mapLayer.getBounds)
            this.leafletMap.fitBounds(mapLayer.getBounds());
        }
      });
  }

  initBgLayer(background: bgType) {
    const { showAttribution } = this.props;
    const attribution =
      'Data &copy; <a href="https://www.openstreetmap.org/">OSM</a> contribs, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

    if (this.bgLayer && background == "tunnels") return;

    if (this.bgLayer) this.bgLayer.remove();

    if (["osm", "tunnels"].includes(background))
      // @ts-ignore
      this.bgLayer = L.tileLayer(
        "https://cdn.digitransit.fi/map/v2/hsl-map-256/{z}/{x}/{y}.png?digitransit-subscription-key=" +
          settings.digitransitKey,
        { attribution: showAttribution ? attribution : "", maxZoom: 21 },
      ).addTo(this.leafletMap);
    // @ts-ignore
    else
      this.bgLayer = L.tileLayer
        .wms("https://kartta.hsy.fi/geoserver/ows?", {
          layers: "taustakartat_ja_aluejaot:Ortoilmakuva_2019",
          maxZoom: 19,
        })
        .addTo(this.leafletMap);
  }

  switchBackground = () => {
    const background = {
      orthophoto: "osm",
      osm: "tunnels",
      tunnels: "orthophoto",
    }[this.state.background] as bgType;
    this.setState({ background });
    this.initBgLayer(background);
  };
}
