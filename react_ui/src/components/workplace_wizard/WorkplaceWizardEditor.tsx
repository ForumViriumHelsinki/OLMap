import React, { ChangeEvent } from "react";
import {
  AccessPoint,
  MapFeature,
  UnloadingPlace,
  Workplace,
  WorkplaceEntrance,
} from "components/workplace_wizard/types";
import { Location } from "util_components/types";
import { workplacesUrl, workplaceUrl } from "components/workplace_wizard/urls";
import * as L from "leaflet";
import { LatLngLiteral, LeafletMouseEvent } from "leaflet";
import _ from "lodash";

import "./WorkplaceWizard.scss";
import sessionRequest from "sessionRequest";
import { useLeaflet } from "react-leaflet";
import MyPositionMap from "util_components/MyPositionMap";
import EntrancesMapLayer from "components/workplace_wizard/EntrancesMapLayer";
import UnloadingPlacesMapLayer from "components/workplace_wizard/UnloadingPlacesMapLayer";
import {
  Line,
  MapClickedPopup,
  positioningOptions,
} from "components/workplace_wizard/util_components";
import WWToolbar from "components/workplace_wizard/WWToolbar";
import { loadMapFeatureTypes } from "components/osm_image_notes/ImageNotesContextProvider";
import { AppContext, MapFeatureTypes } from "components/types";
import {
  APMarker,
  EntranceMarker,
  UPMarker,
  WorkplaceMarker,
} from "components/workplace_wizard/map_markers";

type WorkplaceWizardEditorProps = {
  workplace: Workplace;
  onClose: () => any;
};

type WorkplaceWizardEditorState = {
  workplace: Workplace;
  changed?: boolean;
  positioning?: MapFeature | positioningOptions;
  activeEntrance?: WorkplaceEntrance;
  activeUP?: UnloadingPlace;
  mapClicked?: LatLngLiteral;
  mapFeatureTypes?: MapFeatureTypes;
};

const initialState: WorkplaceWizardEditorState = {
  workplace: {
    street: "",
    housenumber: "",
    name: "",
  },
};

export default class WorkplaceWizardEditor extends React.Component<
  WorkplaceWizardEditorProps,
  WorkplaceWizardEditorState
> {
  state = initialState;
  static contextType = AppContext;
  context!: React.ContextType<typeof AppContext>;

  map?: L.Map = undefined;

  render() {
    const { user } = this.context;
    const { onClose } = this.props;
    const {
      changed,
      positioning,
      mapClicked,
      activeEntrance,
      activeUP,
      workplace,
      mapFeatureTypes,
    } = this.state;

    const DetectClick = () => {
      const map = useLeaflet().map;
      React.useEffect(() => {
        if (map) {
          map.on("click", this.positionChosen);
          return () => {
            map.off("click", this.positionChosen);
          };
        }
      }, [map]);
      return null;
    };

    const entrances = workplace.workplace_entrances || [];
    const delivery_entrance = this.getDeliveryEntrance();
    const isNew =
      !workplace.created_at ||
      Date.now() - Date.parse(workplace.created_at) < 30 * 60 * 1000;
    const canEdit = user || (!workplace.created_by && isNew);

    const gatesolveUrl =
      workplace &&
      workplace.id &&
      `https://app.gatesolve.com/olmap/workplace/${workplace.id}`;

    return !workplace.lat ? null : (
      <>
        <p>
          {workplace.street} {workplace.housenumber} {workplace.unit || ""}
        </p>
        {!canEdit && (
          <div className="alert alert-danger">
            Et voi muuttaa tätä toimipistettä kirjautumatta.{" "}
            <a href="#/login/">Kirjaudu ensin</a> jos haluat tehdä
            tallennettavia muutoksia.
          </div>
        )}
        <div className="card d-block position-relative">
          {positioning && (
            <div className="mapOverlay">
              Valitse kohta klikkaamalla karttaa!
              <button
                className="ml-2 btn btn-sm btn-compact btn-outline-dark"
                onClick={() => this.setState({ positioning: undefined })}
              >
                Peruuta
              </button>
            </div>
          )}
          <div style={{ height: "40vh" }}>
            <MyPositionMap
              zoom={18}
              location={workplace as Location}
              onMapInitialized={(map) => {
                this.map = map;
              }}
            >
              <DetectClick />
              {mapClicked && (
                <MapClickedPopup
                  clickedLatLng={mapClicked}
                  activeEntrance={activeEntrance}
                  editor={this}
                  activeUP={activeUP}
                />
              )}
              <WorkplaceMarker
                workplace={workplace}
                onMove={() => this.move(workplace)}
              />
              <EntrancesMapLayer
                location={{ lat: workplace.lat, lon: workplace.lon }}
                addEntrance={this.addEntrance}
              />
              <UnloadingPlacesMapLayer
                location={{ lat: workplace.lat, lon: workplace.lon }}
                addUP={this.addUP}
              />

              {delivery_entrance && (
                <>
                  <EntranceMarker
                    icon="delivery"
                    entrance={delivery_entrance}
                    entrances={entrances}
                    editor={this}
                    schema={mapFeatureTypes && mapFeatureTypes.Entrance}
                  />
                  <Line f1={workplace} f2={delivery_entrance} />
                </>
              )}

              {entrances
                .filter((e) => e != delivery_entrance)
                .map((entrance, i) => (
                  <React.Fragment key={i}>
                    <EntranceMarker
                      icon="entrance"
                      entrance={entrance}
                      entrances={entrances}
                      editor={this}
                      schema={mapFeatureTypes && mapFeatureTypes.Entrance}
                    />
                    <Line f1={workplace} f2={entrance} />
                  </React.Fragment>
                ))}

              {entrances.map(
                (entrance) =>
                  entrance.unloading_places?.map((up, i) => (
                    <React.Fragment key={i}>
                      <UPMarker
                        up={up}
                        entrance={entrance}
                        editor={this}
                        schema={
                          mapFeatureTypes && mapFeatureTypes.UnloadingPlace
                        }
                      />
                      <Line f1={entrance} f2={up} />

                      {up.access_points?.map((ap: AccessPoint, i) => (
                        <React.Fragment key={i}>
                          <APMarker ap={ap} editor={this} up={up} />
                          <Line f1={up} f2={ap} />
                        </React.Fragment>
                      ))}
                    </React.Fragment>
                  )),
              )}
            </MyPositionMap>
          </div>
        </div>

        <WWToolbar
          addFeature={(positioning) => this.setState({ positioning })}
          activeUP={activeUP}
          activeEntrance={activeEntrance}
        />

        <textarea
          className="form-control mt-2"
          placeholder="Toimitusohjeet"
          rows={5}
          value={workplace.delivery_instructions}
          onChange={this.instructionsChanged}
        />
        {changed && canEdit && (
          <div className="btn-group mt-2 d-flex">
            <button
              className="btn btn-sm btn-compact btn-outline-primary"
              onClick={this.save}
            >
              Tallenna
            </button>
            <button
              className="btn btn-sm btn-compact btn-outline-danger"
              onClick={onClose}
            >
              Sulje
            </button>
          </div>
        )}
        <p>
          {changed || !gatesolveUrl ? (
            "Katsellaksesi ohjeita Gatesolvella, tallenna ensin."
          ) : (
            <>
              Esikatsele ohjeet Gatesolvella ja jaa linkki:{" "}
              <a target="_blank" href={gatesolveUrl}>
                {gatesolveUrl}
              </a>
            </>
          )}
        </p>
        <div className="mt-5 p-3 card">
          <h5>Käyttöohjeita</h5>
          <p>
            <a href="https://youtu.be/2VHsi2N-NW8" target="_blank">
              Katso ohjeet videomuodossa
            </a>
          </p>
          {!delivery_entrance && (
            <p>
              Klikkaa ensin Uusi toimitus-sisäänkäynti ja lisää se kartalle
              oikeaan kohtaan (tärkein, kun tätä tehdään tavarankuljetuksiin).
            </p>
          )}
          {activeEntrance && !activeUP && (
            <p>
              Lisää seuraavaksi lastauspaikka, mihin auton voi jättää
              kuormauksen ajaksi.
            </p>
          )}
          {activeUP && !(activeUP.access_points || []).length && (
            <p>
              Jos ajoreitti ei ole itsestään selvä kannattaa lisätä reittipiste,
              mitä kautta lastauspaikalle käännytään katuverkosta.
            </p>
          )}
          <p>
            Voit lisätä myös muita sisäänkäyntejä (myös pääovi on “muu
            sisäänkäynti”, jos se ei ole tavarankuljetuksiin). Klikkaamalla
            näitä lisättyjä ikoneita aukeaa valikko, jossa kutakin ikonia pystyy
            muokkaamaan tai lisäämään valokuvan paikasta.
          </p>
          <p>
            Toimitusohjeet-tekstikenttään kannattaa kirjoittaa lyhyesti, mitä
            paikassa on huomioitava (esim. korkeusrajoitus, yksisuuntaisuus,
            paikalle johtavan kyltin teksti tms.)
          </p>
          <p>Paina lopuksi Tallenna. ;)</p>
        </div>
      </>
    );
  }

  positionNewUP(e: WorkplaceEntrance) {
    this.closePopup();
    this.setState({ positioning: "newUP", activeEntrance: e });
  }

  positionNewAP(up: UnloadingPlace) {
    this.closePopup();
    this.setState({ positioning: "newAP", activeUP: up });
  }

  move(f: MapFeature) {
    this.closePopup();
    this.setState({ positioning: f });
  }

  private getDeliveryEntrance(wp?: Workplace) {
    const workplace = wp || this.state.workplace;
    const entrances = workplace.workplace_entrances || [];
    return (
      entrances.find((e) => e.deliveries == "main") ||
      entrances.find((e) => e.deliveries == "yes")
    );
  }

  componentDidMount() {
    this.initWPFromProps();
    loadMapFeatureTypes().then((mapFeatureTypes) =>
      this.setState({ mapFeatureTypes }),
    );
  }

  private initWPFromProps() {
    const workplace = this.props.workplace;
    this.setState({
      workplace: workplace,
      activeEntrance:
        this.getDeliveryEntrance(workplace) ||
        (workplace.workplace_entrances || [])[0],
    });
  }

  componentDidUpdate({ workplace }: Readonly<WorkplaceWizardEditorProps>) {
    if (workplace != this.props.workplace) this.initWPFromProps();
  }

  removeItem = (item: MapFeature, lst: MapFeature[]) => {
    const { activeEntrance, activeUP, workplace } = this.state;
    lst.splice(lst.indexOf(item), 1);
    this.closePopup();
    const newState: any = { changed: true };
    if (item == activeEntrance) {
      newState.activeEntrance =
        this.getDeliveryEntrance() || (workplace.workplace_entrances || [])[0];
      if (activeUP && activeEntrance.unloading_places?.includes(activeUP))
        newState.activeUP = ((newState.activeEntrance || {}).unloading_places ||
          [])[0];
    }
    if (item == activeUP)
      newState.activeUP = ((activeEntrance || {}).unloading_places || [])[0];
    this.setState(newState);
    this.forceUpdate();
  };

  addEntrance = (entrance: MapFeature, deliveries: boolean) => {
    this.closePopup();
    const { lat, lon, id, image_note_id, image } = entrance;
    const { workplace } = this.state;

    const wpEntrance: WorkplaceEntrance = {
      lat,
      lon,
      image_note_id,
      image,
      entrance_id: id,
      unloading_places: [],
      entrance_fields: entrance,
      deliveries: deliveries ? "main" : undefined,
    };
    const entrances = workplace.workplace_entrances || [];
    if (deliveries)
      entrances.forEach((e) => {
        e.deliveries = "";
      });
    entrances.push(wpEntrance);
    const newWp: Workplace = { ...workplace, workplace_entrances: entrances };
    this.storeState({
      workplace: newWp,
      changed: true,
      mapClicked: undefined,
      activeEntrance: wpEntrance,
      positioning: undefined,
    });
  };

  closePopup() {
    if (this.map) this.map.closePopup();
  }

  addUP = (up: MapFeature) => {
    const { activeEntrance, workplace } = this.state;
    if (!activeEntrance) return;

    this.closePopup();
    if (!activeEntrance.unloading_places) activeEntrance.unloading_places = [];
    activeEntrance.unloading_places.push(up);
    this.storeState({
      workplace,
      changed: true,
      positioning: undefined,
      mapClicked: undefined,
      activeUP: up,
    });
    this.forceUpdate(); // State internals updated in place, naughty business...
  };

  addAP({ lat, lng }: LatLngLiteral) {
    const { activeUP, workplace } = this.state;
    if (!activeUP) return;

    this.closePopup();
    if (!activeUP.access_points) activeUP.access_points = [];
    activeUP.access_points.push({ lat, lon: lng });
    this.storeState({
      workplace,
      changed: true,
      positioning: undefined,
      mapClicked: undefined,
    });
    this.forceUpdate(); // State internals updated in place, naughty business...
  }

  positionChosen = (e: LeafletMouseEvent) => {
    const { lat, lng } = e.latlng;
    const { positioning, workplace, mapClicked } = this.state;

    if (document.getElementsByClassName("wwPopup").length) {
      this.setState({ mapClicked: undefined });
      // @ts-ignore
      return this.map.closePopup();
    }

    if (!positioning)
      return this.setState({ mapClicked: mapClicked ? undefined : e.latlng });

    if (positioning == "newUP") return this.addUP({ lat, lon: lng });

    if (positioning == "newAP") return this.addAP({ lat, lng });

    if (positioning == "newEntrance")
      return this.addEntrance({ lat, lon: lng }, false);

    if (positioning == "newDeliveryEntrance")
      return this.addEntrance({ lat, lon: lng }, true);

    positioning.lat = lat;
    positioning.lon = lng;

    this.storeState({ workplace, changed: true, positioning: undefined });
    this.forceUpdate(); // State internals updated in place, naughty business...
  };

  save = () => {
    const { workplace } = this.state;

    const [url, method] = workplace.id
      ? [workplaceUrl(workplace.id), "PATCH"]
      : [workplacesUrl, "POST"];

    return sessionRequest(url, { method, data: workplace }).then((response) => {
      if (response.status < 300)
        return response.json().then((newWorkplace) => {
          for (const e of newWorkplace.workplace_entrances)
            e.deliveries = e.deliveries || "";
          _.merge(workplace, newWorkplace);
          this.setState({ workplace, changed: false });
          return workplace;
        });
    });
  };

  instructionsChanged = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const workplace = {
      ...this.state.workplace,
      delivery_instructions: e.target.value,
    } as Workplace;
    this.storeState({ changed: true, workplace });
  };

  storeState(state: WorkplaceWizardEditorState) {
    this.setState(state);
    localStorage.setItem(
      "wwState",
      JSON.stringify({ workplace: this.state.workplace }),
    );
  }
}
