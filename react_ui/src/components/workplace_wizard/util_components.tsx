import {MapFeature} from "components/workplace_wizard/types";
import {Polyline, Popup} from "react-leaflet";
import React from "react";
import {LatLngLiteral} from "leaflet";
import Icon from "util_components/bootstrap/Icon";

export const latLng = (feature: MapFeature) => {
  const {lat, lon} = feature || {};
  const latLng = {lng: lon, lat} as LatLngLiteral;
  return latLng;
};

export const popupBtn = "btn-light p-1 pl-2 btn-block text-left m-0";

export const Line = ({f1, f2}: {f1: MapFeature, f2: MapFeature}) =>
  <Polyline positions={[latLng(f1), latLng(f2)]} color="#ff5000" opacity={0.5} weight={1}/>;

export const WWIcon = (props: any) =>
  <Icon {...props} align="bottom"/>;

export const MoveButton = ({onClick}: {onClick: () => any}) =>
  <button className={popupBtn} onClick={onClick}>
    <WWIcon icon="open_with"/> Siirrä
  </button>;

export const AddUPButton = ({onClick}: {onClick: () => any}) =>
  <button className={popupBtn} onClick={onClick}>
    <WWIcon icon="local_shipping" outline /> Lisää lastauspaikka
  </button>;

export const RemoveButton = ({onClick}: {onClick: () => any}) =>
  <button className={popupBtn} onClick={onClick}>
    <WWIcon icon="delete" outline /> Poista
  </button>;

export const MapClickedPopup = ({clickedLatLng, activeEntrance, editor, activeUP}: any) => {
  const clickedLatLon = {lat: clickedLatLng.lat, lon: clickedLatLng.lng} as MapFeature;

  return <Popup closeOnClick={true} closeButton={false} className="wwPopup" position={clickedLatLng}>
    <button className={popupBtn}
            onClick={() => editor.addEntrance(clickedLatLon, true)}>
      <WWIcon icon="door_front" outline/> Uusi toimitussisäänkäynti
    </button>
    <button className={popupBtn} onClick={() => editor.addEntrance(clickedLatLon, false)}>
      <WWIcon icon="door_front" className="discrete" outline/> Uusi muu sisäänkäynti
    </button>
    {activeEntrance &&
    <button className={popupBtn} onClick={() => editor.addUP(clickedLatLon)}>
      <WWIcon icon="local_shipping" outline/> Lisää lastauspaikka
    </button>
    }
    {activeUP &&
    <button className={popupBtn} onClick={() => editor.addAP(clickedLatLng)}>
      <WWIcon icon="directions" outline/> Lisää reittipiste
    </button>
    }
  </Popup>
};

export type positioningOptions = 'newUP' | 'newAP' | 'newDeliveryEntrance' | 'newEntrance';
