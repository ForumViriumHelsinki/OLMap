import React from 'react';

import Map, {MapMarker} from 'util_components/Map';
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";
import Icon from "util_components/Icon";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import Modal from "util_components/Modal";
import Error from "util_components/Error";

import {getBoundsOfDistance, getDistance} from 'geolib';
// @ts-ignore
import OverpassFrontend from 'overpass-frontend';
import {GeolibInputCoordinates} from "geolib/es/types";
import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMFeature, OSMImageNote} from "components/types";

const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')

// These are searched, in order, to present OSM features as strings:
const osmAttributes: string[][] = [
  ['entrance', 'addr:street', 'addr:housenumber', 'addr:unit'],
  ['addr:street', 'addr:housenumber', 'addr:unit', 'name', 'place', 'shop'],
  ['addr:housenumber', 'addr:unit', 'name', 'place', 'shop'],
  ['name', 'place', 'shop'],
  ['barrier']
];

const osmRegex = osmAttributes.map(([attr]) => attr).join('|');

type OSMPhotoNotesState = OSMImageNote & {
  status: 'initial' | 'locating' | 'relating' | 'commenting' | 'thanks',
  nearbyOSMFeatures: OSMFeature[],
  submitting?: boolean,
  error?: boolean,
  osmImageNotes?: OSMImageNote[],
  selectedNote?: OSMImageNote
}

const initialState: OSMPhotoNotesState = {
  status: 'initial',
  nearbyOSMFeatures: [],
  lat: undefined,
  lon: undefined,
  image: undefined,
  comment: '',
  osm_features: [],
  error: false,
  submitting: false,
  selectedNote: undefined
};

export default class OSMPhotoNotes extends Component<{}> {
  state: OSMPhotoNotesState = initialState;

  static bindMethods = [
    'onImageClick', 'onImageCaptured', 'onCommentClick',
    'onLocationSelected', 'onRelate', 'onCancel', 'onSubmit'
  ];

  componentDidMount() {
    this.loadImageNotes();
  }

  private loadImageNotes() {
    sessionRequest(osmImageNotesUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((osmImageNotes: OSMImageNote[]) => this.setState({osmImageNotes}));
    })
  }

  render() {
    const {status, nearbyOSMFeatures, osm_features, lat, lon, submitting, error, selectedNote} = this.state;
    const location = [lon, lat];

    return <>
      <div className="m-2 mt-0" style={{height: 36}}>
        <input name="image" id="image" className="d-none" type="file"
               accept="image/*" capture="environment"
               onChange={this.onImageCaptured}/>
        {{
          initial:
            <>
              <Button outline color="primary" size="sm" onClick={this.onImageClick}>
                <Icon icon="camera_alt"/>
              </Button>{' '}
              <Button outline color="primary" size="sm" onClick={this.onCommentClick}>
                <Icon icon="comment"/>
              </Button>
              {selectedNote &&
                <Modal title={selectedNote.comment || 'No comment.'}
                       onClose={() => this.setState({selectedNote: undefined})}>
                  {selectedNote.image &&
                    <img src={selectedNote.image} style={{maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain'}} />
                  }
                </Modal>
              }
            </>,
          locating:
            <>
              Scroll the map to select exact position{' '}
              <Button outline color="danger" size="sm" onClick={this.onCancel}>
                Cancel
              </Button>
            </>,
          relating:
            <Modal title="Add relations (optional)" onClose={this.onCancel}>
              <div className="overflow-auto" style={{maxHeight: '80vh'}}><ListGroup>
                {nearbyOSMFeatures.map((osmFeature: any, i) =>
                  <OSMFeatureItem key={i} osmFeature={osmFeature} location={location as LocationTuple}
                                  active={osm_features.includes(osmFeature.id)}
                                  onClick={() => this.toggleRelatedFeature(osmFeature)} />)}
              </ListGroup></div>
              <Button color="primary" size="sm" onClick={this.onRelate}>
                Done
              </Button>
            </Modal>,
          commenting:
            <Modal title="Add comment" onClose={this.onCancel}>
              <Error status={error} message="Submit failed. Try again maybe?"/>
              <textarea className="form-control" rows={5} placeholder="Describe the problem / note (optional)"
                        onChange={(e) => this.setState({comment: e.target.value})} />
              <Button disabled={submitting} color="primary" size="sm" onClick={submitting ? undefined : this.onSubmit}>
                {submitting ? 'Submitting...' : 'Done'}
              </Button>
            </Modal>,
          thanks:
            <Modal title="Thank you" onClose={this.onCancel}>
              <p className="m-2">The comment was saved successfully.</p>
              <Button color="primary" size="sm" onClick={this.onCancel}>
                Close
              </Button>
            </Modal>,
        }[status]}
      </div>
      <Map requestLocation={status == 'locating'}
           onLocationSelected={this.onLocationSelected}
           dotMarkers={this.getImageNoteMarkers()}/>
    </>;
  }

  private onImageClick() {
    this.imageEl().click();
  }

  private onCommentClick() {
    this.setState({status: 'locating'});
  }

  private imageEl() {
    return document.getElementById('image') as HTMLInputElement;
  }

  private onImageCaptured() {
    // @ts-ignore
    this.setState({status: "locating", image: this.imageEl().files[0]})
  }

  private onLocationSelected(location: LocationTuple) {
    const bounds = getBoundsOfDistance(location as GeolibInputCoordinates, 20);
    const overpassBounds = {
      minlat: bounds[0].latitude, maxlat: bounds[1].latitude,
      minlon: bounds[0].longitude, maxlon: bounds[1].longitude};

    overpassFrontend.BBoxQuery(`nwr[~"^(${osmRegex})$"~".*"]`, overpassBounds, {},
      (err: any, response: any) => {
        if (err) console.error(err);
        this.addNearbyFeature(response.data);
      },
      (err: any) => {
        console.log(this.state.nearbyOSMFeatures);
        if (!this.state.nearbyOSMFeatures.length) this.setState({status: 'commenting'});
      }
    );
    this.setState({status: "relating", lon: location[0], lat: location[1]});
  }

  private addNearbyFeature(osmFeature: OSMFeature) {
    if (osmFeature.type == 'relation') return;

    const nearbyOSMFeatures = this.state.nearbyOSMFeatures.slice();

    if (osmFeature.type == 'way') {
      const duplicate = nearbyOSMFeatures.find(
        f => (f.type == 'way') && (f.tags.name == osmFeature.tags.name));
      if (duplicate) return;
    }

    const order = (feature: OSMFeature) => {
      for (const i in osmAttributes)
        if (feature.tags[osmAttributes[i][0]]) return i;
      return osmAttributes.length;
    }

    insertFeature: {
      for (const i in nearbyOSMFeatures)
        if (order(osmFeature) < order(nearbyOSMFeatures[i])) {
          nearbyOSMFeatures.splice(Number(i), 0, osmFeature);
          break insertFeature;
        }
      nearbyOSMFeatures.push(osmFeature);
    }
    this.setState({nearbyOSMFeatures});
  }

  private onRelate() {
    this.setState({status: "commenting"})
  }

  private onCancel() {
    this.setState(initialState);
  }

  private onSubmit() {
    const {comment, lon, lat, osm_features, image} = this.state;
    const fields = {comment, lat, lon, osm_features};

    sessionRequest(osmImageNotesUrl, {method: 'POST', data: fields})
    .then((response: any) => {
      if ((response.status >= 300) || !image) return response;
      return response.json().then((data: any) => {
        let formData = new FormData();
        formData.append('image', image);
        return sessionRequest(osmImageNoteUrl(data.id), {method: 'PATCH', body: formData})
      });
    }).then((response: any) => {
      if ((response.status >= 300)) this.setState({error: true, submitting: false});
      else {
        this.loadImageNotes();
        this.setState({...initialState, status: "thanks"});
      }
    });
    this.setState({submitting: true});
  }

  private toggleRelatedFeature(osmFeature: OSMFeature) {
    const osm_features = this.state.osm_features.slice();
    const index = osm_features.indexOf(osmFeature.id);
    if (index == -1)
      osm_features.push(osmFeature.id)
    else
      osm_features.splice(index, 1);
    this.setState({osm_features})
  }

  private getImageNoteMarkers(): MapMarker[] {
    const {osmImageNotes} = this.state;
    if (!osmImageNotes) return [];
    return osmImageNotes.map((osmImageNote) =>
      ({lat: osmImageNote.lat as number,
        lon: osmImageNote.lon as number,
        onClick: () => this.onNoteSelect(osmImageNote)}))
  }

  private onNoteSelect(selectedNote: OSMImageNote) {
    this.setState({selectedNote});
  }
}


type OSMFeatureItemProps = {
  osmFeature: OSMFeature,
  location: LocationTuple,
  active: boolean,
  onClick: () => any
};

class OSMFeatureItem extends React.Component<OSMFeatureItemProps> {
  render() {
    const {active, onClick} = this.props;
    return <ListGroupItem active={active} onClick={onClick}>{this.label()}</ListGroupItem>;
  }

  private label() {
    const {osmFeature, location} = this.props;
    const {tags} = osmFeature;
    let label = '';

    osmAttributes.forEach((attrs) => {
      if (!label && tags[attrs[0]])
        attrs.forEach(attr => {
          if (tags[attr]) label += tags[attr] + ' ';
        })
    });

    if (osmFeature.type == 'node')
      label += ` (${getDistance(osmFeature, location as GeolibInputCoordinates)}m)`
    return label && (label[0].toUpperCase() + label.slice(1)).replace('_', ' ');
  }
}
