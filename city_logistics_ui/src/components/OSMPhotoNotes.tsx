import React from 'react';

import Map from 'util_components/Map';
// @ts-ignore
import {Button, Input} from "reactstrap";
import Icon from "util_components/Icon";
import Component from "util_components/Component";
import {LocationTuple} from "util_components/types";
import Modal from "util_components/Modal";

type OSMPhotoNotesProps = {}

type OSMPhotoNotesState = {
  status: 'initial' | 'locating' | 'commenting' | 'thanks',
  image?: any,
  location?: LocationTuple,
  comment?: string
}

export default class OSMPhotoNotes extends Component<OSMPhotoNotesProps> {
  state: OSMPhotoNotesState = {status: 'initial'};

  static bindMethods = ['onImageClick', 'onImageCaptured', 'onLocationSelected', 'onCancel', 'onSubmit'];

  render() {
    const {status} = this.state;

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
          commenting:
            <Modal title="Add comment" onClose={this.onCancel}>
              <textarea className="form-control" rows={5} placeholder="Describe the problem / note (optional)"
                        onChange={(e) => this.setState({comment: e.target.value})} />
              <Button color="primary" size="sm" onClick={this.onSubmit}>
                Save note
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
    this.setState({status: "commenting", location})
  }

  private onCancel() {
    this.setState({status: "initial", image: undefined, location: undefined})
  }

  private onSubmit() {
    this.setState({status: "thanks", image: undefined, location: undefined, comment: undefined})
  }
}
