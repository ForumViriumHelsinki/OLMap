import React from "react";
import sessionRequest from "sessionRequest";
import { mapFeatureTypesUrl, osmImageNotesUrl, osmImageNoteUrl } from "urls";
import {
  AppContext,
  ImageNotesContextType,
  MapFeatureTypes,
  OSMImageNote,
  ImageNotesContext,
} from "components/types";

type ImageNotesContextProps = {};

type ImageNotesContextState = {
  osmImageNotes?: OSMImageNote[];
  error?: boolean;
  mapFeatureTypes?: MapFeatureTypes;
};

const initialState: ImageNotesContextState = {};

export let imageNotesContext: any;

export default class ImageNotesContextProvider extends React.Component<
  ImageNotesContextProps,
  ImageNotesContextState
> {
  state = initialState;
  static contextType = AppContext;

  render() {
    const { children } = this.props;
    const { user } = this.context;

    const context: ImageNotesContextType = {
      ...this.state,
      user,
      addNote: this.addNote,
      refreshNote: this.refreshNote,
      loadImageNotes: this.loadImageNotes,
    };
    return (
      <ImageNotesContext.Provider value={context}>
        {children}
      </ImageNotesContext.Provider>
    );
  }

  componentDidMount() {
    this.loadImageNotes();
    this.loadMapFeatureTypes();
    imageNotesContext = this;
  }

  loadImageNotes = () => {
    sessionRequest(osmImageNotesUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((osmImageNotes: OSMImageNote[]) => {
          this.setState({ osmImageNotes });
        });
    });
  };

  refreshNote = (note: OSMImageNote) => {
    return sessionRequest(osmImageNoteUrl(note.id as number)).then(
      (response) => {
        if (!this.state.osmImageNotes) return;
        const osmImageNotes = this.state.osmImageNotes.slice();
        const index = osmImageNotes.findIndex((note2) => note2.id == note.id);

        if (response.status == 404) {
          // The note has been rejected
          osmImageNotes.splice(index, 1);
          this.setState({ osmImageNotes });
        } else if (response.status == 200)
          response.json().then((note) => {
            // Align created_by with how it is serialized in the note list response:
            if (note.created_by && typeof note.created_by !== "number")
              note.created_by = note.created_by.id;
            osmImageNotes.splice(index, 1, note);
            this.setState({ osmImageNotes });
          });
      },
    );
  };

  addNote = (note: OSMImageNote) => {
    if (!this.state.osmImageNotes) return;
    // Align created_by with how it is serialized in the note list response:
    if (note.created_by && typeof note.created_by !== "number")
      note.created_by = note.created_by.id;
    const osmImageNotes = this.state.osmImageNotes.slice();
    osmImageNotes.push(note);
    this.setState({ osmImageNotes });
  };

  loadMapFeatureTypes() {
    loadMapFeatureTypes().then((mapFeatureTypes) => {
      this.setState({ mapFeatureTypes });
    });
  }
}

export var mapFeatureTypes: any;

export const loadMapFeatureTypes = () => {
  if (mapFeatureTypes) return Promise.resolve(mapFeatureTypes);
  else
    return sessionRequest(mapFeatureTypesUrl).then((response) => {
      if (response.status < 300)
        return response.json().then((featureTypes) => {
          mapFeatureTypes = featureTypes;
          return mapFeatureTypes;
        });
    });
};
