import {AccessPoint, MapFeature, UnloadingPlace, Workplace, WorkplaceEntrance} from "components/workplace_wizard/types";
import {Marker, Polyline, Popup} from "react-leaflet";
import React, {useState} from "react";
import {default as L, LatLngLiteral} from "leaflet";
import Icon from "util_components/bootstrap/Icon";
import Modal from "util_components/bootstrap/Modal";
import ZoomableImage from "util_components/ZoomableImage";
import wp_icon from "components/workplace_wizard/workplace.svg";
import delivery_icon from "components/workplace_wizard/delivery_entrance.svg";
import entrance_icon from "components/workplace_wizard/entrance.svg";
import unloading_icon from "components/workplace_wizard/unloading.svg";
import access_icon from "components/workplace_wizard/access.svg";

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

export const ImageButton = ({f}: {f: MapFeature}) => {
  const [visible, setVisible] = useState(false);
  return !f.image ? null : <>
    <button className={popupBtn} onClick={() => setVisible(true)}>
      <WWIcon icon="photo_camera" outline/> Näytä kuva
    </button>
    {visible && <Modal onClose={() => setVisible(false)} title="Kuva">
      <ZoomableImage src={f.image} className="wwModalImg"/>
    </Modal>}
  </>;
};

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

const iSize = 28;

function icon(src: string, size: number = iSize, cls?: string) {
  return L.divIcon({
    className: 'mapIcon' + (cls ? ' ' + cls : ''),
    html: `<img src="${src}"/>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export const icons: {[k: string]: any} = {
  workplace: icon(wp_icon),
  delivery: icon(delivery_icon),
  entrance: icon(entrance_icon),
  unloading: icon(unloading_icon),
  access: icon(access_icon)
};

export const WorkplaceMarker = ({onMove, workplace}: {onMove: any, workplace: Workplace}) =>
  <Marker position={latLng(workplace)} icon={icons.workplace}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <MoveButton onClick={onMove}/>
    </Popup>
  </Marker>;

type EntranceMarkerProps = {
  entrance: WorkplaceEntrance,
  editor: any,
  entrances: WorkplaceEntrance[],
  icon: string
};

export const EntranceMarker = ({entrance, entrances, editor, icon}: EntranceMarkerProps) =>
  <Marker position={latLng(entrance)} icon={icons[icon]}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <ImageButton f={entrance}/>
      <MoveButton onClick={() => editor.move(entrance)}/>
      <AddUPButton onClick={() => editor.positionNewUP(entrance)}/>
      <RemoveButton onClick={() => editor.removeItem(entrance, entrances)}/>
    </Popup>
  </Marker>;

type UPMarkerProps = {
  entrance: WorkplaceEntrance,
  editor: any,
  up: UnloadingPlace
};

export const UPMarker = ({up, entrance, editor}: UPMarkerProps) =>
  <Marker position={latLng(up)} icon={icons.unloading}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <ImageButton f={up}/>
      <MoveButton onClick={() => editor.move(up)}/>
      <button className={popupBtn} onClick={() => {editor.positionNewAP(up)}}>
        <WWIcon icon="directions" outline /> Lisää reittipiste
      </button>
      <RemoveButton onClick={() => editor.removeItem(up, entrance.unloading_places as UnloadingPlace[])}/>
    </Popup>
  </Marker>;

type APMarkerProps = {
  ap: AccessPoint,
  editor: any,
  up: UnloadingPlace
};

export const APMarker = ({ap, up, editor}: APMarkerProps) =>
  <Marker position={latLng(ap)} icon={icons.access}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <MoveButton onClick={() => editor.move(ap)}/>
      <RemoveButton onClick={() => editor.removeItem(ap, up.access_points as MapFeature[])}/>
    </Popup>
  </Marker>;

export type positioningOptions = 'newUP' | 'newAP' | 'newDeliveryEntrance' | 'newEntrance';
