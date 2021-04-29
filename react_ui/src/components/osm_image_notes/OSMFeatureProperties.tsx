import React from 'react';

// @ts-ignore
import Form from "react-jsonschema-form";

import {AppContext, JSONSchema, OSMImageNote} from "components/types";
// @ts-ignore
import {Button} from "reactstrap";
import {OSMFeature} from "util_components/osm/types";
import ConfirmButton from "util_components/bootstrap/ConfirmButton";
import {userCanEditNote} from "components/osm_image_notes/utils";
import WorkplaceTypeWidget from "components/osm_image_notes/WorkplaceTypeWidget";

type PKFeature = {[field: string]: any}

type OSMFeaturePropertiesProps = {
  schema: JSONSchema,
  onSubmit: (data: any) => any,
  osmFeatureName: string,
  osmImageNote: OSMImageNote,
  nearbyFeatures: OSMFeature[]
}

type OSMFeaturePropertiesState = {
  editingFeature?: PKFeature
}

const initialState: OSMFeaturePropertiesState = {
  editingFeature: undefined
};

type AnyObject = {[key: string]: any};

const customWidgets: AnyObject = {
  Workplace: {type: WorkplaceTypeWidget}
};

export default class OSMFeatureProperties extends React.Component<OSMFeaturePropertiesProps, OSMFeaturePropertiesState> {
  state: OSMFeaturePropertiesState = initialState;

  static contextType = AppContext;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: []
  };

  render() {
    const {schema, osmFeatureName, osmImageNote} = this.props;
    const {user} = this.context;
    const editable = userCanEditNote(user, osmImageNote);
    const {editingFeature} = this.state;
    // @ts-ignore
    const pkFeatures = (osmImageNote[(this.getFeatureListFieldName())] || []) as PKFeature[];

    return <>
      {pkFeatures.map((pkFeature, i) =>
        <div key={pkFeature.id || i}>
          <p className="mt-2">
            <strong>{osmFeatureName}</strong>
            {(pkFeature != editingFeature) &&
              <>
                {' '}
                {editable &&
                  <Button size="sm" color="primary" outline className="btn-compact"
                          onClick={() => this.setState({editingFeature: pkFeature})}>Edit</Button>
                }
                {' '}
                {pkFeature.as_osm_tags &&
                  <Button size="sm" color="secondary" outline className="btn-compact"
                          onClick={() => this.copyText((pkFeature.id || i) + '-osm-text')}>Copy</Button>
                }
                {editable &&
                  <ConfirmButton onClick={() => this.onDelete(pkFeature)}
                                 className="btn-outline-danger btn-compact btn-sm float-right"
                                 confirm={`Really delete ${osmFeatureName}?`}>Delete</ConfirmButton>
                }
              </>
            }
          </p>
          {(pkFeature === editingFeature) ?
            <Form schema={schema} uiSchema={this.getUISchema()} className="compact"
                  formData={pkFeature}
                  onSubmit={this.onSubmit}>
              <Button size="sm" color="primary" type="submit" className="btn-compact pl-4 pr-4 mr-2">Save</Button>
              <Button tag="span" size="sm" color="secondary" outline className="btn-compact pl-4 pr-4"
                      onClick={this.onCancel}>Cancel</Button>
              <ConfirmButton onClick={() => this.onDelete(pkFeature)}
                             className="btn-outline-danger btn-compact btn-sm float-right"
                             confirm={`Really delete ${osmFeatureName}?`}>Delete</ConfirmButton>
            </Form>
            :
            <>
              {pkFeature.as_osm_tags &&
              <textarea id={(pkFeature.id || i) + '-osm-text'}
                        rows={Object.keys(pkFeature.as_osm_tags).length}
                        className="form-control"
                        readOnly
                        value={Object.entries(pkFeature.as_osm_tags).map(([k, v]) => `${k}=${v}`).join('\n')}/>
              }
            </>
          }
        </div>
      )}
      {editable &&
        <p className="mt-2">
          <Button size="sm" color="primary" outline className="btn-compact" onClick={this.newPKFeature}>
            New {osmFeatureName}
          </Button>
        </p>
      }
    </>
  }

  private onCancel = () => {
    const {osmImageNote} = this.props;
    const {editingFeature} = this.state;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    if (!editingFeature.id) featureList.splice(featureList.indexOf(editingFeature, 1));
    this.setState({editingFeature: undefined})
  };

  onDelete = (feature: PKFeature) => {
    const {osmImageNote, onSubmit} = this.props;
    const fieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const featureList = osmImageNote[fieldName];
    // @ts-ignore
    featureList.splice(featureList.indexOf(feature), 1);
    // @ts-ignore
    Promise.resolve(onSubmit({[fieldName]: featureList}))
      .then(() => {if (feature == this.state.editingFeature) this.setState({editingFeature: undefined})});
  };

  newPKFeature = () => {
    const {osmImageNote, nearbyFeatures, schema} = this.props;
    const listFieldName = this.getFeatureListFieldName();
    // @ts-ignore
    const pkFeatures = (osmImageNote[listFieldName] || []) as PKFeature[];
    const selectedFeatureIds = osmImageNote.osm_features || [];
    const selectedFeatures = nearbyFeatures.filter((f) => selectedFeatureIds.includes(f.id));

    const newPKFeature: {[k: string]: any} = {};

    if (schema.properties.street && schema.properties.housenumber) {
      const f = selectedFeatures.find(f => f.tags['addr:housenumber'] && f.tags['addr:street']);
      if (f) {
        newPKFeature.street = f.tags['addr:street'];
        newPKFeature.housenumber = f.tags['addr:housenumber'];
      }
    }

    pkFeatures.push(newPKFeature);
    // @ts-ignore
    osmImageNote[listFieldName] = pkFeatures;
    this.setState({editingFeature: newPKFeature});
  };

  private copyText(osmTextId: string) {
    (document.getElementById(osmTextId) as HTMLInputElement).select();
    document.execCommand('copy');
  }

  private getFeatureListFieldName() {
    return `${this.props.osmFeatureName.toLowerCase()}_set`;
  }

  onSubmit = (data: any) => {
    const {onSubmit, osmImageNote} = this.props;
    const {editingFeature} = this.state;
    const fieldName = this.getFeatureListFieldName();

    Object.assign(editingFeature, data.formData);

    // @ts-ignore
    Promise.resolve(onSubmit({[fieldName]: osmImageNote[fieldName]}))
      .then(() => this.setState({editingFeature: undefined}));
  };

  private getUISchema() {
    const {schema, osmFeatureName} = this.props;
    const radioFields = Object.entries(schema.properties)
      .filter(([field, spec]) =>
        // @ts-ignore
        String(spec.type) == String(["boolean", "null"]))
      .map(([field, spec]) => {
        // @ts-ignore
        return [field, {"ui:widget": "radio"}]
      });
    const customWidgetsForSchema = customWidgets[osmFeatureName] || {};
    const customFields = Object.entries(schema.properties)
      .filter(([field, spec]) => customWidgetsForSchema[field])
      .map(([field, spec]) => {
        return [field, {"ui:widget": customWidgetsForSchema[field]}]
      });
    return Object.fromEntries(radioFields.concat(customFields));
  }
}
