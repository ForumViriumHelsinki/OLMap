import React from 'react';
import _ from 'lodash';
import Form from 'react-jsonschema-form';

import {
  AppContext,
  JSONSchema,
  MapFeature,
  OSMImageNote,
  WorkplaceEntrance,
} from 'components/types';
// @ts-ignore
import { Button } from 'reactstrap';
import { OSMFeature } from 'util_components/osm/types';
import ConfirmButton from 'util_components/bootstrap/ConfirmButton';
import { userCanEditNote } from 'components/osm_image_notes/utils';
import WorkplaceTypeWidget from 'components/map_features/WorkplaceTypeWidget';
import WorkplaceEntrances from 'components/map_features/WorkplaceEntrances';
import UnloadingPlaceEntrances from 'components/map_features/UnloadingPlaceEntrances';
import UnloadingPlaceAccessPoints from 'components/map_features/UnloadingPlaceAccessPoints';
import MapFeatureOSMLink from 'components/map_features/MapFeatureOSMLink';
import { addressString, capitalize } from 'utils';
import Icon from 'util_components/bootstrap/Icon';
import sessionRequest from 'sessionRequest';
import { osmImageNotesUrl, workplaceUrl } from 'urls';
import { imageNotesContext } from 'components/osm_image_notes/ImageNotesContextProvider';
import MapFeatureForm, { omitFields } from 'components/map_features/MapFeatureForm';

type MapFeatureEditorProps = {
  schema: JSONSchema;
  onSubmit: (data: any) => any;
  onDelete?: () => any;
  featureTypeName: string;
  osmImageNote: OSMImageNote;
  nearbyFeatures: OSMFeature[];
  refreshNote?: () => any;
  mapFeature: MapFeature;
  osmFeature?: OSMFeature;
  addNearbyFeature: (f: OSMFeature) => any;
};

type Mode = 'compact' | 'editing' | 'expanded';

type MapFeatureEditorState = {
  mode: Mode;
};

const initialState: MapFeatureEditorState = {
  mode: 'compact',
};

type FeatureViewProps = {
  mapFeature: MapFeature;
};

class EntranceView extends React.Component<FeatureViewProps> {
  render() {
    const { mapFeature } = this.props;
    const access = mapFeature.access == 'yes' ? 'public' : mapFeature.access;
    const typeStr = _.filter([access, mapFeature.type, 'entrance']).join(' ');
    const tags = ['loadingdock', 'wheelchair', 'keycode', 'buzzer'].filter((t) => mapFeature[t]);
    const rows = ['width', 'height', 'phone', 'opening_hours'].filter((t) => mapFeature[t]);
    const badgeCls = 'rounded-pill pl-2 pr-2 mr-1 text-primary small border-primary border';
    return (
      <div>
        <strong>
          {capitalize(typeStr)}: {addressString(mapFeature) || 'No address'}
        </strong>
        <div>
          {tags.map((t) => (
            <span key={t} className={badgeCls}>
              {t}
            </span>
          ))}
        </div>
        {mapFeature.description && <div>{mapFeature.description}</div>}
        {rows.map((t) => (
          <div key={t}>
            <strong>{t}:</strong> {mapFeature[t]}
          </div>
        ))}
      </div>
    );
  }
}

class WorkplaceView extends React.Component<FeatureViewProps> {
  render() {
    const { mapFeature } = this.props;
    const rows = ['level', 'phone', 'opening_hours', 'delivery_hours', 'max_vehicle_height'].filter(
      (t) => mapFeature[t],
    );
    return (
      <div>
        <strong>
          {mapFeature.name || 'Workplace'}: {addressString(mapFeature) || 'No address'}
        </strong>
        {mapFeature.delivery_instructions && <div>{mapFeature.delivery_instructions}</div>}
        {rows.map((t) => (
          <div key={t}>
            <strong>{capitalize(t.replace('_', ' '))}:</strong> {mapFeature[t]}
          </div>
        ))}
      </div>
    );
  }
}

class UnloadingPlaceView extends React.Component<FeatureViewProps> {
  render() {
    const { mapFeature } = this.props;
    const rows = [
      ['length', 'm'],
      ['width', 'm'],
      ['max_weight', 't'],
    ].filter(([t]) => mapFeature[t]);
    return (
      <div>
        <strong>Unloading place {mapFeature.opening_hours || ''}</strong>
        {mapFeature.description && <div>{mapFeature.description}</div>}
        {rows.map(([t, unit]) => (
          <div key={t}>
            <strong>{capitalize(t.replace('_', ' '))}: </strong>
            {Number(mapFeature[t]).toPrecision(2)}
            {unit}
          </div>
        ))}
      </div>
    );
  }
}

const featureTypeViews: { [type: string]: any } = {
  Entrance: EntranceView,
  UnloadingPlace: UnloadingPlaceView,
  Workplace: WorkplaceView,
};

export default class MapFeatureEditor extends React.Component<
  MapFeatureEditorProps,
  MapFeatureEditorState
> {
  state: MapFeatureEditorState = initialState;

  static contextType = AppContext;
  context!: React.ContextType<typeof AppContext>;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: [],
  };

  componentDidMount() {
    if (!this.props.mapFeature.id) this.setState({ mode: 'editing' });
  }

  render() {
    const {
      schema,
      featureTypeName,
      osmImageNote,
      refreshNote,
      mapFeature,
      osmFeature,
      nearbyFeatures,
      addNearbyFeature,
    } = this.props;
    const { user } = this.context;
    const editable = userCanEditNote(user, osmImageNote);
    const { mode } = this.state;

    const TypeView = featureTypeViews[featureTypeName];

    const nextMode: { [m: string]: Mode } = {
      editing: 'editing',
      compact: 'expanded',
      expanded: 'compact',
    };

    return (
      <div className="list-group-item pl-0">
        <div className="d-flex">
          <div
            className="flex-grow-0 clickable"
            onClick={() => this.setState({ mode: nextMode[mode] })}
          >
            <Icon icon={mode == 'compact' ? 'expand_more' : 'expand_less'} />
          </div>
          <div className="flex-grow-1">
            {TypeView ? <TypeView {...{ mapFeature }} /> : <strong>{featureTypeName}</strong>}

            {mode == 'editing' ? (
              <MapFeatureForm
                featureTypeName={featureTypeName}
                schema={schema}
                onSubmit={this.onSubmit}
                onDelete={this.onDelete}
                onCancel={this.onCancel}
                mapFeature={mapFeature}
              />
            ) : (
              <>
                {mode == 'expanded' && (
                  <>
                    {editable && (
                      <div className="mt-3 mb-3 d-flex">
                        <button
                          className="btn btn-sm btn-compact btn-outline-primary d-block flex-grow-1"
                          onClick={() => this.setState({ mode: 'editing' })}
                        >
                          Edit
                        </button>
                        {featureTypeName == 'Workplace' && (
                          <button
                            className="btn btn-sm btn-compact btn-outline-secondary d-block flex-grow-1"
                            onClick={this.extractWorkplace}
                          >
                            Extract
                          </button>
                        )}
                        <ConfirmButton
                          onClick={() => this.onDelete()}
                          className="btn-outline-danger btn-compact btn-sm d-block flex-grow-1"
                          confirm={`Really delete ${featureTypeName}?`}
                        >
                          Delete
                        </ConfirmButton>
                      </div>
                    )}

                    {featureTypeName == 'Workplace' && editable && (
                      <WorkplaceEntrances
                        workplace={mapFeature}
                        osmImageNote={osmImageNote}
                        refreshNote={refreshNote}
                        schema={schema.properties.workplace_entrances.items}
                      />
                    )}
                    {featureTypeName == 'UnloadingPlace' && editable && mapFeature.id && (
                      <div className="mb-4 mt-1">
                        <UnloadingPlaceEntrances
                          unloadingPlace={mapFeature}
                          osmImageNote={osmImageNote}
                        />
                        <UnloadingPlaceAccessPoints
                          unloadingPlace={mapFeature}
                          osmImageNote={osmImageNote}
                        />
                      </div>
                    )}

                    {mapFeature.as_osm_tags && (
                      <div className="mt-2">
                        <textarea
                          id={mapFeature.id + '-osm-text'}
                          rows={Object.keys(mapFeature.as_osm_tags).length}
                          className="form-control"
                          readOnly
                          value={Object.entries(mapFeature.as_osm_tags)
                            .map(([k, v]) => `${k}=${v}`)
                            .join('\n')}
                        />
                        <button
                          className="btn btn-compact btn-sm btn-outline-secondary mt-2"
                          onClick={() => this.copyText(mapFeature.id + '-osm-text')}
                        >
                          Copy
                        </button>
                      </div>
                    )}
                    <MapFeatureOSMLink
                      {...{
                        featureTypeName,
                        mapFeature,
                        osmFeature,
                        nearbyFeatures,
                        osmImageNote,
                        addNearbyFeature,
                        saveFeature: this.saveFeature,
                      }}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  onCancel = () => {
    const { osmImageNote, mapFeature, onDelete } = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    this.setState({ mode: 'compact' });
    if (!mapFeature.id) {
      featureList.splice(featureList.indexOf(mapFeature, 1));
      onDelete && onDelete();
    }
  };

  onDelete = () => {
    const { osmImageNote, onSubmit, onDelete, mapFeature } = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    featureList.splice(featureList.indexOf(mapFeature), 1);
    // @ts-ignore
    Promise.resolve(onSubmit({ [fieldName]: featureList })).then(() => {
      this.setState({ mode: 'compact' });
      onDelete && onDelete();
    });
  };

  extractWorkplace = () => {
    const { mapFeature, onSubmit } = this.props;
    const osmImageNote = this.props.osmImageNote;
    const { lat, lon } = osmImageNote;

    sessionRequest(osmImageNotesUrl, {
      method: 'POST',
      data: { lat, lon, tags: ['Workplace'] },
    })
      .then((response) => response.json())
      .then((imageNote: OSMImageNote) => {
        sessionRequest(workplaceUrl(mapFeature.id as number), {
          method: 'PATCH',
          data: { image_note_id: imageNote.id },
        }).then(() => {
          if (imageNotesContext) imageNotesContext.addNote(imageNote);
          window.location.hash = `#/Notes/${imageNote.id}/`;
        });

        // @ts-ignore
        if (osmImageNote.workplace_set.length == 1)
          onSubmit({
            tags: (osmImageNote.tags || []).filter((t) => t != 'Workplace'),
          });
      });
  };

  private copyText(osmTextId: string) {
    (document.getElementById(osmTextId) as HTMLInputElement).select();
    document.execCommand('copy');
  }

  private getFeatureListFieldName() {
    return `${this.props.featureTypeName.toLowerCase()}_set`;
  }

  onSubmit = (data: any) => {
    const { mapFeature } = this.props;
    Object.assign(mapFeature, data.formData);
    this.saveFeature().then(() => this.setState({ mode: 'compact' }));
  };

  saveFeature = () => {
    const { onSubmit, osmImageNote, featureTypeName } = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const mapFeatures = osmImageNote[fieldName].map((feature: MapFeature) =>
      _.omit(feature, ...(omitFields[featureTypeName] || [])),
    );
    return Promise.resolve(
      onSubmit({
        [fieldName]: mapFeatures,
        osm_features: osmImageNote.osm_features,
      }),
    );
  };
}
