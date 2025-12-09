import { default as L } from 'leaflet';
import {
  AccessPoint,
  MapFeature,
  UnloadingPlace,
  Workplace,
  WorkplaceEntrance,
} from 'components/workplace_wizard/types';
import { Marker, Popup } from 'react-leaflet';
import React from 'react';
import { JSONSchema } from 'components/types';
import wp_icon from 'components/workplace_wizard/workplace.svg';
import delivery_icon from 'components/workplace_wizard/delivery_entrance.svg';
import entrance_icon from 'components/workplace_wizard/entrance.svg';
import unloading_icon from 'components/workplace_wizard/unloading.svg';
import access_icon from 'components/workplace_wizard/access.svg';
import { ImageButton } from 'components/workplace_wizard/ImageButton';
import { EditMapFeatureButton } from 'components/workplace_wizard/EditMapFeatureButton';
import {
  AddUPButton,
  latLng,
  MoveButton,
  popupBtn,
  RemoveButton,
  WWIcon,
} from 'components/workplace_wizard/util_components';

const iSize = 28;

function icon(src: string, size: number = iSize, cls?: string) {
  return L.divIcon({
    className: 'mapIcon' + (cls ? ' ' + cls : ''),
    html: `<img src="${src}"/>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export const icons: { [k: string]: any } = {
  workplace: icon(wp_icon),
  delivery: icon(delivery_icon),
  entrance: icon(entrance_icon),
  unloading: icon(unloading_icon),
  access: icon(access_icon),
};

export const WorkplaceMarker = ({ onMove, workplace }: { onMove: any; workplace: Workplace }) => (
  <Marker position={latLng(workplace)} icon={icons.workplace}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <MoveButton onClick={onMove} />
    </Popup>
  </Marker>
);

type EntranceMarkerProps = {
  entrance: WorkplaceEntrance;
  editor: any;
  entrances: WorkplaceEntrance[];
  icon: string;
  schema: JSONSchema;
};

export const EntranceMarker = (props: EntranceMarkerProps) => {
  const { entrance, entrances, editor, icon, schema } = props;

  return (
    <Marker position={latLng(entrance)} icon={icons[icon]}>
      <Popup closeOnClick={true} closeButton={false} className="wwPopup">
        <ImageButton f={entrance} editor={editor} />
        <MoveButton onClick={() => editor.move(entrance)} />
        <AddUPButton onClick={() => editor.positionNewUP(entrance)} />
        <EditMapFeatureButton
          mapFeature={entrance}
          schema={schema}
          featureTypeName="Entrance"
          onChange={() => editor.setState({ changed: true })}
        />
        <RemoveButton onClick={() => editor.removeItem(entrance, entrances)} />
      </Popup>
    </Marker>
  );
};

type UPMarkerProps = {
  entrance: WorkplaceEntrance;
  editor: any;
  up: UnloadingPlace;
  schema: JSONSchema;
};

export const UPMarker = ({ up, entrance, editor, schema }: UPMarkerProps) => (
  <Marker position={latLng(up)} icon={icons.unloading}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <ImageButton f={up} editor={editor} />
      <MoveButton onClick={() => editor.move(up)} />
      <button
        className={popupBtn}
        onClick={() => {
          editor.positionNewAP(up);
        }}
      >
        <WWIcon icon="directions" outline /> Lisää reittipiste
      </button>
      <EditMapFeatureButton
        mapFeature={up}
        schema={schema}
        featureTypeName="UnloadingPlace"
        onChange={() => editor.setState({ changed: true })}
      />
      <RemoveButton
        onClick={() => editor.removeItem(up, entrance.unloading_places as UnloadingPlace[])}
      />
    </Popup>
  </Marker>
);

type APMarkerProps = {
  ap: AccessPoint;
  editor: any;
  up: UnloadingPlace;
};

export const APMarker = ({ ap, up, editor }: APMarkerProps) => (
  <Marker position={latLng(ap)} icon={icons.access}>
    <Popup closeOnClick={true} closeButton={false} className="wwPopup">
      <MoveButton onClick={() => editor.move(ap)} />
      <RemoveButton onClick={() => editor.removeItem(ap, up.access_points as MapFeature[])} />
    </Popup>
  </Marker>
);
