import React from 'react';
import _ from 'lodash';
import { MapFeature, OSMImageNote } from 'components/types';
// @ts-ignore
import { Button } from 'reactstrap';
import Modal from 'util_components/bootstrap/Modal';
import { SimpleOSMImageNotesMap } from 'components/osm_image_notes/OSMImageNotesMap';
import { Location } from 'util_components/types';
import sessionRequest from 'sessionRequest';
import { osmImageNoteUrl, unloadingPlaceUrl } from 'urls';
// @ts-ignore

type UnloadingPlaceEntrancesProps = {
  osmImageNote: OSMImageNote;
  unloadingPlace: MapFeature;
};

type UnloadingPlaceEntrancesState = {
  open: boolean;
};

const initialState: UnloadingPlaceEntrancesState = {
  open: false,
};

export default class UnloadingPlaceEntrances extends React.Component<
  UnloadingPlaceEntrancesProps,
  UnloadingPlaceEntrancesState
> {
  state: UnloadingPlaceEntrancesState = initialState;

  static defaultProps = {
    osmImageNote: {},
  };

  render() {
    const { osmImageNote, unloadingPlace } = this.props;
    const { open } = this.state;

    if (!unloadingPlace.entrances) unloadingPlace.entrances = [];

    return (
      <div>
        {unloadingPlace.entrances.length} entrances linked.{' '}
        <Button
          size="sm"
          color="primary"
          outline
          className="btn-compact"
          onClick={() => this.setState({ open: true })}
        >
          Link entrances
        </Button>
        {open && (
          <Modal
            onClose={() => this.setState({ open: false })}
            title="Link unloading place entrances"
          >
            <div className="p-2">
              Select entrances to link ({unloadingPlace.entrances.length} linked):
            </div>
            <div style={{ height: 400 }}>
              <SimpleOSMImageNotesMap
                filters={{ tags: ['Entrance'] }}
                onNoteSelected={this.onNoteSelected}
                location={osmImageNote as Location}
                zoom={19}
                selectedNotes={unloadingPlace.entrance_notes}
              />
            </div>
            <div className="p-2">
              <button
                className="btn btn-primary btn-block"
                onClick={() => this.setState({ open: false })}
              >
                Done
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  onNoteSelected = (note: OSMImageNote) => {
    sessionRequest(osmImageNoteUrl(note.id as number))
      .then((response) => response.json())
      .then((entranceNote) => {
        const { unloadingPlace } = this.props;
        const entrance = entranceNote.entrance_set && entranceNote.entrance_set[0];
        if (!entrance) return;
        const entrances = unloadingPlace.entrances.includes(entrance.id)
          ? _.without(unloadingPlace.entrances, entrance.id)
          : unloadingPlace.entrances.concat([entrance.id]);
        const url = unloadingPlaceUrl(unloadingPlace.id as number);
        sessionRequest(url, { method: 'PATCH', data: { entrances } }).then((response) => {
          if (response.status < 300) {
            response.json().then((data) => {
              Object.assign(unloadingPlace, data);
              this.forceUpdate();
            });
          }
        });
      });
  };
}
