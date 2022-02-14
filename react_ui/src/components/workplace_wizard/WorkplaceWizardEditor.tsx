import React, {ChangeEvent} from 'react';
import {AccessPoint, MapFeature, UnloadingPlace, Workplace, WorkplaceEntrance} from "components/workplace_wizard/types";
import {Location} from 'util_components/types';
import {
  workplacesUrl,
  workplaceUrl
} from "components/workplace_wizard/urls";
import * as L from "leaflet";
import {LatLngLiteral, LeafletMouseEvent} from "leaflet";

import wp_icon from './workplace.svg';
import delivery_icon from './delivery_entrance.svg';
import entrance_icon from './entrance.svg';
import unloading_icon from './unloading.svg';
import access_icon from './access.svg';

import './WorkplaceWizard.scss';
import sessionRequest from "sessionRequest";
import Icon from "util_components/bootstrap/Icon";
import {Marker, Polyline, Popup, useMapEvent} from "react-leaflet";
import Modal from "util_components/bootstrap/Modal";
import ZoomableImage from "util_components/ZoomableImage";
import MyPositionMap from "util_components/MyPositionMap";
import EntrancesMapLayer from "components/workplace_wizard/EntrancesMapLayer";


type WorkplaceWizardEditorProps = {
  workplace: Workplace,
  onClose: () => any
}

type WorkplaceWizardEditorState = {
  workplace: Workplace,
  changed?: boolean,
  positioning?: MapFeature | 'newUP' | 'newAP' | 'newDeliveryEntrance' | 'newEntrance',
  activeEntrance?: WorkplaceEntrance,
  activeUP?: UnloadingPlace,
  modalImage?: string,
  mapClicked?: LatLngLiteral
}

const initialState: WorkplaceWizardEditorState = {
  workplace: {
    street: '', housenumber: '', name: ''
  }
};

const iSize = 28;

function icon(src: string, size: number=iSize, cls?: string) {
  return L.divIcon({
    className: 'mapIcon' + (cls ? ' ' + cls : ''),
    html: `<img src="${src}"/>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
  });
}

const icons = {
  workplace: icon(wp_icon),
  delivery: icon(delivery_icon),
  entrance: icon(entrance_icon),
  unloading: icon(unloading_icon),
  access: icon(access_icon)
};

export default class WorkplaceWizardEditor extends React.Component<WorkplaceWizardEditorProps, WorkplaceWizardEditorState> {
  state = initialState;

  map?: L.Map = undefined;

  render() {
    const {onClose} = this.props;
    const {changed, positioning, modalImage,
           mapClicked, activeEntrance, activeUP, workplace} = this.state;

    const DetectClick = () => {
      useMapEvent('click', this.positionChosen);
      return null;
    };

    const popupBtn = "btn-light p-1 pl-2 btn-block text-left m-0";

    const entrances = workplace.workplace_entrances || [];

    const delivery_entrance = this.getDeliveryEntrance();

    const Line = ({f1, f2}: {f1: MapFeature, f2: MapFeature}) =>
      <Polyline positions={[this.latLng(f1), this.latLng(f2)]} color="#ff5000" opacity={0.5} weight={1}/>;

    const WWIcon = (props: any) =>
      <Icon {...props} align="bottom"/>;

    const ImageButton = ({f}: {f: MapFeature}) =>
      !f.image ? null : <button className={popupBtn} onClick={() => this.setState({modalImage: f.image})}>
        <WWIcon icon="photo_camera" outline/> Näytä kuva
      </button>;

    const MoveButton = ({f}: {f: MapFeature}) =>
      <button className={popupBtn}
              onClick={() => {this.closePopup(); this.setState({positioning: f})}}>
        <WWIcon icon="open_with"/> Siirrä
      </button>;

    const AddUPButton = ({e}: {e: WorkplaceEntrance}) =>
      <button className={popupBtn}
              onClick={() => {this.closePopup(); this.setState({positioning: 'newUP', activeEntrance: e})}}>
        <WWIcon icon="local_shipping" outline /> Lisää lastauspaikka
      </button>;

    const RemoveButton = ({item, lst}: {item: MapFeature, lst: MapFeature[]}) =>
      <button className={popupBtn} onClick={() => this.removeItem(item, lst)}>
        <WWIcon icon="delete" outline /> Poista
      </button>;

    const NearbyEntrancePopup = ({entrance}: {entrance: MapFeature}) =>
      <Popup closeOnClick={true} closeButton={false} className="wwPopup">
        <ImageButton f={entrance}/>
        <div className="p-2 font-weight-bold"><WWIcon icon="location_city"/> Yhdistä:</div>
        <button className={popupBtn} onClick={() => this.addEntrance(entrance, true)}>
          <WWIcon icon="door_front" outline/> Toimitussisäänkäynti
        </button>
        <button className={popupBtn} onClick={() => this.addEntrance(entrance, false)}>
          <WWIcon icon="door_front" className="discrete" outline/> Muu sisäänkäynti
        </button>
      </Popup>;

    const clickedLatLon = mapClicked && {lat: mapClicked.lat, lon: mapClicked.lng} as MapFeature;

    const toolbarBtn = "btn btn-outline-primary mr-2 btn-compact";
    return !workplace.lat ? null : <>
      {modalImage && <Modal onClose={() => this.setState({modalImage: undefined})} title="Kuva">
        <ZoomableImage src={modalImage} className="wwModalImg"/>
      </Modal>}
      <p>{workplace.street} {workplace.housenumber} {workplace.unit || ''}</p>
      <div className="card d-block position-relative">
        {positioning &&
          <div className="mapOverlay">
            Valitse kohta klikkaamalla karttaa!
            <button className="ml-2 btn btn-sm btn-compact btn-outline-dark"
                    onClick={() => this.setState({positioning: undefined})}>Peruuta</button>
          </div>
        }
        <div style={{height: '40vh'}}>
          <MyPositionMap zoom={18} location={workplace as Location} onMapInitialized={map => {this.map = map}}>
            <DetectClick/>
            {mapClicked && clickedLatLon &&
              <Popup closeOnClick={true} closeButton={false} className="wwPopup" position={mapClicked}>
                <button className={popupBtn}
                        onClick={() => this.addEntrance(clickedLatLon, true)}>
                  <WWIcon icon="door_front" outline/> Uusi toimitussisäänkäynti
                </button>
                <button className={popupBtn} onClick={() => this.addEntrance(clickedLatLon, false)}>
                  <WWIcon icon="door_front" className="discrete" outline/> Uusi muu sisäänkäynti
                </button>
                {activeEntrance &&
                  <button className={popupBtn} onClick={() => this.addUP(mapClicked)}>
                    <WWIcon icon="local_shipping" outline /> Lisää lastauspaikka
                  </button>
                }
                {activeUP &&
                  <button className={popupBtn} onClick={() => this.addAP(mapClicked)}>
                    <WWIcon icon="directions" outline /> Lisää reittipiste
                  </button>
                }
              </Popup>
            }
            <Marker position={this.latLng(workplace)} icon={icons.workplace}>
              <Popup closeOnClick={true} closeButton={false} className="wwPopup">
                <MoveButton f={workplace}/>
              </Popup>
            </Marker>

            <EntrancesMapLayer location={{lat: workplace.lat, lon: workplace.lon}} Popup={NearbyEntrancePopup}/>

            {delivery_entrance && <>
              <Marker position={this.latLng(delivery_entrance)} icon={icons.delivery}>
                <Popup closeOnClick={true} closeButton={false} className="wwPopup">
                  <ImageButton f={delivery_entrance}/>
                  <MoveButton f={delivery_entrance}/>
                  <AddUPButton e={delivery_entrance}/>
                  <RemoveButton item={delivery_entrance} lst={entrances}/>
                </Popup>
              </Marker>
              <Line f1={workplace} f2={delivery_entrance} />
            </>}

            {entrances.filter(e => e != delivery_entrance).map(entrance =>
              <React.Fragment key={entrance.id}>
                <Marker position={this.latLng(entrance)} icon={icons.entrance}>
                  <Popup closeOnClick={true} closeButton={false} className="wwPopup">
                    <ImageButton f={entrance}/>
                    <MoveButton f={entrance}/>
                    <AddUPButton e={entrance}/>
                    <RemoveButton item={entrance} lst={entrances}/>
                  </Popup>
                </Marker>
                <Line f1={workplace} f2={entrance} />
              </React.Fragment>
            )}

            {entrances.map(entrance => entrance.unloading_places?.map(up =>
              <React.Fragment key={up.id}>
                <Marker position={this.latLng(up)} icon={icons.unloading}>
                  <Popup closeOnClick={true} closeButton={false} className="wwPopup">
                    <ImageButton f={up}/>
                    <MoveButton f={up}/>
                    <button className={popupBtn}
                            onClick={() => {this.closePopup(); this.setState({positioning: 'newAP', activeUP: up})}}>
                      <WWIcon icon="directions" outline /> Lisää reittipiste
                    </button>
                    <RemoveButton item={up} lst={entrance.unloading_places as UnloadingPlace[]}/>
                  </Popup>
                </Marker>
                <Line f1={entrance} f2={up} />

                {up.access_points?.map((ap: AccessPoint, i) =>
                  <React.Fragment key={i}>
                    <Marker position={this.latLng(ap)} icon={icons.access}>
                      <Popup closeOnClick={true} closeButton={false} className="wwPopup">
                        <MoveButton f={ap}/>
                        <RemoveButton item={ap} lst={up.access_points as MapFeature[]}/>
                      </Popup>
                    </Marker>
                    <Line f1={up} f2={ap} />
                  </React.Fragment>
                )}
              </React.Fragment>
            ))}
          </MyPositionMap>
        </div>
      </div>

      <div className="mt-2">
        <button className={toolbarBtn}
                onClick={() => this.setState({positioning: 'newDeliveryEntrance'})}>
          <WWIcon icon="door_front" outline text={<>Uusi toimitus-<br/>sisäänkäynti</>}/>
        </button>
        <button className={toolbarBtn}
                onClick={() => this.setState({positioning: 'newEntrance'})}>
          <WWIcon icon="door_front" className="discrete" outline text={<>Uusi muu<br/>sisäänkäynti</>}/>
        </button>

        {activeEntrance &&
          <button className={toolbarBtn}
                  onClick={() => {this.setState({positioning: 'newUP'})}}>
            <WWIcon icon="local_shipping" outline text={<>Lisää<br/>lastauspaikka</>}/>
          </button>
        }
        {activeUP &&
          <button className={toolbarBtn}
                  onClick={() => {this.setState({positioning: 'newAP'})}}>
            <WWIcon icon="directions" outline text={<>Lisää<br/>reittipiste</>}/>
          </button>
        }
      </div>

      <textarea className="form-control mt-2" placeholder="Toimitusohjeet" rows={5}
        value={workplace.delivery_instructions}
        onChange={this.instructionsChanged}/>
      {changed && <div className="btn-group mt-2 d-flex">
        <button className="btn btn-sm btn-compact btn-outline-primary"
                onClick={this.save}>Tallenna</button>
        <button className="btn btn-sm btn-compact btn-outline-danger"
                onClick={onClose}>Sulje</button>
      </div>}
    </>
  }

  private getDeliveryEntrance() {
    const {workplace} = this.state;
    const entrances = workplace.workplace_entrances || [];
    return entrances.find(e => e.deliveries == 'main') ||
      entrances.find(e => e.deliveries == 'yes');
  }

  componentDidMount() {
    this.setState({workplace: this.props.workplace});
  }

  componentDidUpdate({workplace}: Readonly<WorkplaceWizardEditorProps>) {
    if (workplace != this.props.workplace) this.setState({workplace: this.props.workplace});
  }

  removeItem = (item: MapFeature, lst: MapFeature[]) => {
    const {activeEntrance, activeUP, workplace} = this.state;
    lst.splice(lst.indexOf(item), 1);
    this.closePopup();
    const newState: any = {changed: true};
    if (item == activeEntrance) {
      newState.activeEntrance = this.getDeliveryEntrance() || (workplace.workplace_entrances || [])[0];
      if (activeUP && activeEntrance.unloading_places?.includes(activeUP))
        newState.activeUP = ((newState.activeEntrance || {}).unloading_places || [])[0];
    }
    if (item == activeUP) newState.activeUP = ((activeEntrance || {}).unloading_places || [])[0];
    this.setState(newState);
    this.forceUpdate();
  };

  addEntrance = (entrance: MapFeature, deliveries: boolean) => {
    this.closePopup();
    const {lat, lon, id, image_note_id, image} = entrance;
    const {workplace} = this.state;

    const wpEntrance: WorkplaceEntrance = {
      lat, lon, image_note_id, image, entrance_id: id, unloading_places: [], deliveries: deliveries ? 'main' : undefined
    };
    const entrances = workplace.workplace_entrances || [];
    if (deliveries) entrances.forEach(e => {e.deliveries = undefined;});
    entrances.push(wpEntrance);
    const newWp: Workplace = {...workplace, workplace_entrances: entrances};
    this.storeState({workplace: newWp, changed: true, mapClicked: undefined,
                     activeEntrance: wpEntrance, positioning: undefined});
  };

  private closePopup() {
    if (this.map) this.map.closePopup();
  }

  addUP({lat, lng}: LatLngLiteral) {
    const {activeEntrance, workplace} = this.state;
    if (!activeEntrance) return;

    this.closePopup();
    if (!activeEntrance.unloading_places) activeEntrance.unloading_places = [];
    const unloadingPlace = {lat, lon: lng};
    activeEntrance.unloading_places.push(unloadingPlace);
    this.storeState({workplace, changed: true, positioning: undefined,
                     mapClicked: undefined, activeUP: unloadingPlace});
    this.forceUpdate(); // State internals updated in place, naughty business...
  }

  addAP({lat, lng}: LatLngLiteral) {
    const {activeUP, workplace} = this.state;
    if (!activeUP) return;

    this.closePopup();
    if (!activeUP.access_points) activeUP.access_points = [];
    activeUP.access_points.push({lat, lon: lng});
    this.storeState({workplace, changed: true, positioning: undefined, mapClicked: undefined});
    this.forceUpdate(); // State internals updated in place, naughty business...
  }

  positionChosen = (e: LeafletMouseEvent) => {
    const {lat, lng} = e.latlng;
    const {positioning, workplace, mapClicked} = this.state;

    if (document.getElementsByClassName('wwPopup').length) {
      this.setState({mapClicked: undefined});
      // @ts-ignore
      return this.map.closePopup();
    }

    if (!positioning) return this.setState({mapClicked: mapClicked ? undefined : e.latlng});

    if (positioning == 'newUP') return this.addUP({lat, lng});

    if (positioning == 'newAP') return this.addAP({lat, lng});

    if (positioning == 'newEntrance') return this.addEntrance({lat, lon: lng}, false);

    if (positioning == 'newDeliveryEntrance') return this.addEntrance({lat, lon: lng}, true);

    positioning.lat = lat;
    positioning.lon = lng;

    this.storeState({workplace, changed: true, positioning: undefined});
    this.forceUpdate(); // State internals updated in place, naughty business...
  };

  save = () => {
    const {workplace} = this.state;

    const [url, method] = workplace.id ? [workplaceUrl(workplace.id), 'PATCH'] : [workplacesUrl, 'POST'];

    sessionRequest(url, {method, data: workplace})
    .then(response => {
      if (response.status < 300) response.json().then((workplace) =>
        this.setState({workplace, changed: false}))})
  };

  instructionsChanged = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const workplace = {...this.state.workplace, delivery_instructions: e.target.value} as Workplace;
    this.storeState({changed: true, workplace});
  };

  storeState(state: WorkplaceWizardEditorState) {
    this.setState(state);
    localStorage.setItem('wwState', JSON.stringify({workplace: this.state.workplace}));
  }

  private latLng(feature: MapFeature) {
    const {lat, lon} = feature || {};
    const latLng = {lng: lon, lat} as LatLngLiteral;
    return latLng;
  }
}
