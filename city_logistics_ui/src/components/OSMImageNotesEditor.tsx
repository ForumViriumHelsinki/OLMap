import React from 'react';

import Map from 'util_components/Map';
// @ts-ignore
import {Button} from "reactstrap";
import Icon from "util_components/Icon";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import Modal from "util_components/Modal";
import Error from "util_components/Error";

import sessionRequest from "sessionRequest";
import {osmImageNotesUrl, osmImageNoteUrl} from "urls";
import {OSMImageNote} from "components/types";
import OSMImageNotes from "components/OSMImageNotes";
import OSMFeaturesSelection from "util_components/OSMFeaturesSelection";

type OSMImageNotesEditorState = OSMImageNote & {
  status: 'initial' | 'locating' | 'relating' | 'commenting' | 'thanks',
  submitting?: boolean,
  error?: boolean,
  osmImageNotesLayer?: any
}

const initialState: OSMImageNotesEditorState = {
  status: 'initial',
  lat: undefined,
  lon: undefined,
  image: undefined,
  comment: '',
  osm_features: [],
  error: false,
  submitting: false
};

export default class OSMImageNotesEditor extends Component<{}> {
  state: OSMImageNotesEditorState = initialState;

  static bindMethods = [
    'onImageClick', 'onImageCaptured', 'onCommentClick',
    'onLocationSelected', 'onCancel', 'onSubmit'
  ];

  imageNotesRef = React.createRef<OSMImageNotes>();

  render() {
    const {status, lat, lon, submitting, error, osmImageNotesLayer} = this.state;
    const location = [lon, lat] as LocationTuple;

    return <>
      <div className="m-2 mt-0" style={{height: 36}}>
        <input name="image" id="image" className="d-none" type="file"
               accept="image/*" capture="environment"
               onChange={this.onImageCaptured}/>
        <OSMImageNotes onMapLayerLoaded={(osmImageNotesLayer: any) => this.setState({osmImageNotesLayer})}
                       ref={this.imageNotesRef}/>
        {{
          initial:
            <>
              <Button outline color="primary" size="sm" onClick={this.onImageClick}>
                <Icon icon="camera_alt"/>
              </Button>{' '}
              <Button outline color="primary" size="sm" onClick={this.onCommentClick}>
                <Icon icon="comment"/>
              </Button>
            </>,
          locating:
            <>
              Scroll map to select position{' '}
              <Button outline color="danger" size="sm" onClick={this.onCancel}>
                Cancel
              </Button>
            </>,
          relating:
            <Modal title="Add relations (optional)" onClose={this.onCancel}>
              <OSMFeaturesSelection
                location={location}
                onSelect={osm_features => this.setState({osm_features, status: 'commenting'})}/>
            </Modal>,
          commenting:
            <Modal title="Add comment" onClose={this.onCancel}>
              <Error status={error} message="Submit failed. Try again maybe?"/>
              <textarea className="form-control" rows={5}
                        placeholder="Describe the problem / note (optional)"
                        onChange={(e) =>
                          this.setState({comment: e.target.value})} />
              <Button block disabled={submitting} color="primary" size="sm"
                      onClick={submitting ? undefined : this.onSubmit}>
                {submitting ? 'Submitting...' : 'Done'}
              </Button>
            </Modal>,
          thanks:
            <Modal title="Thank you" onClose={this.onCancel}>
              <p className="m-2">The comment was saved successfully.</p>
              <Button block color="primary" size="sm" onClick={this.onCancel}>
                Close
              </Button>
            </Modal>,
        }[status]}
      </div>
      <Map requestLocation={status == 'locating'}
           onLocationSelected={this.onLocationSelected}
           extraLayers={osmImageNotesLayer && [osmImageNotesLayer]}/>
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
    const files = this.imageEl().files as FileList;
    this.setState({status: "locating", image: files[0]})
  }

  private onLocationSelected(location: LocationTuple) {
    this.setState({status: "relating", lon: location[0], lat: location[1]});
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
        if (this.imageNotesRef.current) this.imageNotesRef.current.loadImageNotes();
        this.setState({...initialState, status: "thanks"});
      }
    });
    this.setState({submitting: true});
  }
}
