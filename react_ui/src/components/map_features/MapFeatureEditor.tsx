import React from 'react';
import _ from 'lodash';
// @ts-ignore
import Form from "react-jsonschema-form";

import {AppContext, JSONSchema, MapFeature, OSMImageNote, WorkplaceEntrance} from "components/types";
// @ts-ignore
import {Button} from "reactstrap";
import {OSMFeature} from "util_components/osm/types";
import ConfirmButton from "util_components/bootstrap/ConfirmButton";
import {userCanEditNote} from "components/osm_image_notes/utils";
import WorkplaceTypeWidget from "components/map_features/WorkplaceTypeWidget";
import WorkplaceEntrances from "components/map_features/WorkplaceEntrances";
import UnloadingPlaceEntrances from "components/map_features/UnloadingPlaceEntrances";
import UnloadingPlaceAccessPoints from "components/map_features/UnloadingPlaceAccessPoints";

type MapFeatureEditorProps = {
  schema: JSONSchema,
  onSubmit: (data: any) => any,
  onDelete?: () => any,
  featureTypeName: string,
  osmImageNote: OSMImageNote,
  nearbyFeatures: OSMFeature[],
  refreshNote?: () => any,
  mapFeature: MapFeature
}

type MapFeatureEditorState = {
  editing: boolean
}

const initialState: MapFeatureEditorState = {
  editing: false
};

type AnyObject = {[key: string]: any};

const customWidgets: AnyObject = {
  Workplace: {type: WorkplaceTypeWidget}
};

const omitFields: AnyObject = {
  UnloadingPlace: ['entrances'],
  Workplace: ['workplace_entrances']
};

export default class MapFeatureEditor extends React.Component<MapFeatureEditorProps, MapFeatureEditorState> {
  state: MapFeatureEditorState = initialState;

  static contextType = AppContext;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: []
  };

  componentDidMount() {
    if (!this.props.mapFeature.id) this.setState({editing: true});
  }

  render() {
    const {schema, featureTypeName, osmImageNote, refreshNote, mapFeature} = this.props;
    const {user} = this.context;
    const editable = userCanEditNote(user, osmImageNote);
    const {editing} = this.state;

    const filteredSchema = {...schema};
    filteredSchema.properties = omitFields[featureTypeName] ? Object.fromEntries(
      Object.entries(schema.properties).filter(([k, v]) => !omitFields[featureTypeName].includes(k))
    ) : schema.properties;

    return <div>
      <p className="mt-2">
        <strong>{featureTypeName}</strong>
        {!editing &&
          <>
            {' '}
            {editable &&
              <Button size="sm" color="primary" outline className="btn-compact"
                      onClick={() => this.setState({editing: true})}>Edit</Button>
            }
            {' '}
            {mapFeature.as_osm_tags &&
              <Button size="sm" color="secondary" outline className="btn-compact"
                      onClick={() => this.copyText(mapFeature.id + '-osm-text')}>Copy</Button>
            }
            {editable &&
              <ConfirmButton onClick={() => this.onDelete()}
                             className="btn-outline-danger btn-compact btn-sm float-right"
                             confirm={`Really delete ${featureTypeName}?`}>Delete</ConfirmButton>
            }
          </>
        }
      </p>
      {editing ?
        <Form schema={filteredSchema} uiSchema={this.getUISchema()} className="compact"
              formData={mapFeature}
              onSubmit={this.onSubmit}>
          <Button size="sm" color="primary" type="submit" className="btn-compact pl-4 pr-4 mr-2">Save</Button>
          <Button tag="span" size="sm" color="secondary" outline className="btn-compact pl-4 pr-4"
                  onClick={this.onCancel}>Cancel</Button>
          <ConfirmButton onClick={() => this.onDelete()}
                         className="btn-outline-danger btn-compact btn-sm float-right"
                         confirm={`Really delete ${featureTypeName}?`}>Delete</ConfirmButton>
        </Form>
        :
        <>
          {mapFeature.as_osm_tags &&
          <textarea id={mapFeature.id + '-osm-text'}
                    rows={Object.keys(mapFeature.as_osm_tags).length}
                    className="form-control"
                    readOnly
                    value={Object.entries(mapFeature.as_osm_tags).map(([k, v]) => `${k}=${v}`).join('\n')}/>
          }
        </>
      }

      {featureTypeName == 'Workplace' && editable && !editing &&
        <WorkplaceEntrances workplace={mapFeature} osmImageNote={osmImageNote} refreshNote={refreshNote}
                            schema={schema.properties.workplace_entrances.items}/>
      }
      {featureTypeName == 'UnloadingPlace' && editable && !editing && mapFeature.id &&
        <div className="mb-4 mt-1">
          <UnloadingPlaceEntrances unloadingPlace={mapFeature} osmImageNote={osmImageNote}/>
          <UnloadingPlaceAccessPoints unloadingPlace={mapFeature} osmImageNote={osmImageNote}/>
        </div>
      }
    </div>
  }

  private onCancel = () => {
    const {osmImageNote, mapFeature, onDelete} = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    this.setState({editing: false});
    if (!mapFeature.id) {
      featureList.splice(featureList.indexOf(mapFeature, 1));
      onDelete && onDelete();
    }
  };

  onDelete = () => {
    const {osmImageNote, onSubmit, onDelete, mapFeature} = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    featureList.splice(featureList.indexOf(mapFeature), 1);
    // @ts-ignore
    Promise.resolve(onSubmit({[fieldName]: featureList}))
    .then(() => {
      this.setState({editing: false});
      onDelete && onDelete();
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
    const {onSubmit, osmImageNote, mapFeature, featureTypeName} = this.props;
    const fieldName = this.getFeatureListFieldName();

    Object.assign(mapFeature, data.formData);

    // @ts-ignore
    const mapFeatures = osmImageNote[fieldName]
      .map((feature: MapFeature) => _.omit(feature, ...(omitFields[featureTypeName] || [])));

    Promise.resolve(onSubmit({[fieldName]: mapFeatures}))
      .then(() => this.setState({editing: false}));
  };

  private getUISchema() {
    const {schema, featureTypeName} = this.props;
    const radioFields = Object.entries(schema.properties)
      .filter(([field, spec]) =>
        // @ts-ignore
        String(spec.type) == String(["boolean", "null"]))
      .map(([field, spec]) => {
        // @ts-ignore
        return [field, {"ui:widget": "radio"}]
      });
    const customWidgetsForSchema = customWidgets[featureTypeName] || {};
    const customFields = Object.entries(schema.properties)
      .filter(([field, spec]) => customWidgetsForSchema[field])
      .map(([field, spec]) => {
        return [field, {"ui:widget": customWidgetsForSchema[field]}]
      });
    const textFields = Object.entries(schema.properties)
        // @ts-ignore
      .filter(([field, spec]) => spec.type == 'string' && !spec.maxLength && !spec.enum)
      .map(([field, spec]) => {
        return [field, {"ui:widget": 'textarea'}]
      });
    return Object.fromEntries(radioFields.concat(customFields).concat(textFields));
  }
}
