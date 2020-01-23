import React from 'react';

import Map from 'util_components/Map';
// @ts-ignore
import {Button, ListGroup, ListGroupItem} from "reactstrap";
import Icon from "util_components/Icon";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import Modal from "util_components/Modal";
import Error from "util_components/Error";

import {getBoundsOfDistance, getDistance, getDistanceFromLine} from 'geolib';

// @ts-ignore
import OverpassFrontend from 'overpass-frontend';
import {GeolibInputCoordinates} from "geolib/es/types";
import sessionRequest, {login} from "sessionRequest";
import {osmImageNoteAttachUrl, osmImageNotesUrl} from "urls";
const overpassFrontend = new OverpassFrontend('//overpass-api.de/api/interpreter')

type OSMFeature = {
  type: "node" | "way" | "relation",
  id: number,
  lat: number,
  lon: number,
  tags: {[tag:string]: string}
}

// These are searched, in order, to present OSM features as strings:
const osmAttributes: string[][] = [
  ['entrance', 'addr:street', 'addr:housenumber', 'addr:unit'],
  ['addr:street', 'addr:housenumber', 'addr:unit', 'name', 'place', 'shop'],
  ['addr:housenumber', 'addr:unit', 'name', 'place', 'shop'],
  ['name', 'place', 'shop'],
  ['barrier']
];

const osmRegex = osmAttributes.map(([attr]) => attr).join('|');

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


type OSMPhotoNotesState = {
  status: 'initial' | 'locating' | 'relating' | 'commenting' | 'thanks',
  image?: any,
  location?: LocationTuple,
  comment?: string,
  nearbyOSMFeatures: OSMFeature[],
  relatedFeatures: number[],
  submitting?: boolean,
  error?: boolean
}

const initialState: OSMPhotoNotesState = {
  status: 'initial',
  nearbyOSMFeatures: [],
  location: undefined,
  image: undefined,
  comment: '',
  relatedFeatures: [],
  error: false,
  submitting: false
};

export default class OSMPhotoNotes extends Component<{}> {
  state: OSMPhotoNotesState = initialState;

  static bindMethods = ['onImageClick', 'onImageCaptured', 'onLocationSelected', 'onRelate', 'onCancel', 'onSubmit'];

  render() {
    const {status, nearbyOSMFeatures, relatedFeatures, location, submitting, error} = this.state;

    return <>
      <div className="m-2 mt-0" style={{height: 36}}>
        <input name="image" id="image" className="d-none" type="file"
               accept="image/*" capture="environment"
               onChange={this.onImageCaptured}/>
        {{
          initial:
            <Button outline color="primary" size="sm" onClick={this.onImageClick}>
              <Icon icon="camera_alt"/>
            </Button>,
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
                                  active={relatedFeatures.includes(osmFeature.id)}
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
              <p>The comment was saved successfully.</p>
              <Button color="primary" size="sm" onClick={this.onCancel}>
                Close
              </Button>
            </Modal>,
        }[status]}
      </div>
      <Map requestLocation={status == 'locating'} onLocationSelected={this.onLocationSelected} />
    </>;
  }

  private onImageClick() {
    this.imageEl().click();
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
        if (location == this.state.location)
          this.addNearbyFeature(response.data);
      },
      (err: any) => {
        console.log(this.state.nearbyOSMFeatures);
        if (!this.state.nearbyOSMFeatures.length) this.setState({status: 'commenting'});
      }
    );
    this.setState({status: "relating", location});
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
    const {comment, location, relatedFeatures, image} = this.state;

    sessionRequest(osmImageNotesUrl, {method: 'POST', data: {comment, location, relatedFeatures}})
    .then((response: any) => {
      if ((response.status >= 300) || !image) return response;
      return response.json().then((data: any) => {
        let formData = new FormData();
        formData.append('image', image);
        return sessionRequest(osmImageNoteAttachUrl(data.id), {method: 'POST', body: formData})
      });
    }).then((response: any) => {
      if ((response.status >= 300)) this.setState({error: true, submitting: false});
      else this.setState({...initialState, status: "thanks"});
    });
    this.setState({submitting: true});
  }

  private toggleRelatedFeature(osmFeature: OSMFeature) {
    const relatedFeatures = this.state.relatedFeatures.slice();
    const index = relatedFeatures.indexOf(osmFeature.id);
    if (index == -1)
      relatedFeatures.push(osmFeature.id)
    else
      relatedFeatures.splice(index, 1);
    this.setState({relatedFeatures})
  }
}
