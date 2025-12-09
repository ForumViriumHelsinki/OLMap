import React from 'react';
import { withRouter } from 'react-router-dom';
import _ from 'lodash';

import { ImageNotesContext, OSMImageNote } from 'components/types';
import { OSMChangeset } from 'util_components/osm/types';
import { Location } from 'util_components/types';
import OSMImageNoteFiltersButton from 'components/osm_image_notes/OSMImageNoteFiltersButton';
import NotificationsButton from 'components/osm_image_notes/NotificationsButton';
import NewOSMImageNote from 'components/osm_image_notes/NewOSMImageNote';
import OSMImageNoteModal from 'components/osm_image_notes/OSMImageNoteModal';
import OSMImageNotesMap from 'components/osm_image_notes/OSMImageNotesMap';
import MapToolButton from 'components/osm_image_notes/MapToolButton';
import OSMChangesetSelectionButton from 'components/osm_image_notes/OSMChangesetSelectionButton';

type OSMImageNotesEditorProps = {
  history: any; // from withRouter
  location: any; // from withRouter
  match: any; // from withRouter
  selectedNoteId?: number;
  newNote?: boolean;
  osmFeatures?: number[];
};

type OSMImageNotesEditorState = {
  filters: any;
  selectedChangeset?: OSMChangeset;
  selectLocation?: (location: any) => any;
  onLocationCancelled?: () => any;
  location?: Location;
};

const initialState: () => OSMImageNotesEditorState = () => ({
  filters: {},
});

class OSMImageNotesEditor extends React.Component<
  OSMImageNotesEditorProps,
  OSMImageNotesEditorState
> {
  state: OSMImageNotesEditorState = initialState();

  static contextType = ImageNotesContext;

  render() {
    const { newNote, osmFeatures, selectedNoteId, history } = this.props;
    const { osmImageNotes, mapFeatureTypes, refreshNote, loadImageNotes } = this.context;
    const { filters, selectedChangeset, selectLocation, location } = this.state;

    const note =
      osmImageNotes &&
      selectedNoteId &&
      (_.find(osmImageNotes, { id: selectedNoteId }) || ({ id: selectedNoteId } as OSMImageNote));

    return (
      <div className="flex-grow-1">
        <div className="position-absolute map-tools p-3">
          <NewOSMImageNote
            requestNoteType={newNote}
            osmFeatures={osmFeatures}
            requestLocation={this.requestLocation}
            cancelLocationRequest={this.cancelLocationRequest}
          />

          {!selectLocation && (
            <>
              <MapToolButton icon="refresh" onClick={loadImageNotes} />
              <OSMImageNoteFiltersButton
                osmImageNotes={osmImageNotes}
                onFiltersChanged={(filters) => this.setState({ filters })}
                mapFeatureTypes={mapFeatureTypes}
              />
              <a href="/editing-process.html" target="_blank">
                <MapToolButton icon="help" />
              </a>
              <OSMChangesetSelectionButton
                selectedChangeset={selectedChangeset}
                onChangesetSelected={(selectedChangeset) => this.setState({ selectedChangeset })}
              />
              <NotificationsButton />
            </>
          )}
        </div>
        <OSMImageNotesMap
          onNoteSelected={(note) => history.push(`/Notes/${note.id}/`)}
          filters={filters}
          selectLocation={selectLocation}
          location={location}
          osmChangeset={selectedChangeset}
        />
        {note && (
          <OSMImageNoteModal
            mapFeatureTypes={mapFeatureTypes}
            note={note}
            onClose={() => {
              refreshNote(note);
              history.push('/Notes/');
            }}
            showOnMap={() => {
              this.setState({ location: note });
              history.push('/Notes/');
            }}
            requestLocation={this.requestLocation}
            cancelLocationRequest={this.cancelLocationRequest}
          />
        )}
      </div>
    );
  }

  requestLocation = (onLocationSelected: (l: Location) => any, initial?: Location) => {
    const selectLocation = (l: Location) => {
      onLocationSelected(l);
      this.setState({ selectLocation: undefined });
    };
    this.setState(initial ? { selectLocation, location: initial } : { selectLocation });
  };

  cancelLocationRequest = () => {
    this.setState({ selectLocation: undefined });
  };
}

export default withRouter(OSMImageNotesEditor);
