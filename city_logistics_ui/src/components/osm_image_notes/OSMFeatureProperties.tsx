import React from 'react';

// @ts-ignore
import Form from "react-jsonschema-form";

import {JSONSchema, OSMImageNote} from "components/types";
// @ts-ignore
import {Button} from "reactstrap";
import {OSMFeature} from "util_components/types";

const valueFromOSMTags: {[tag: string]: (f: OSMFeature) => any} = {
  'street': (f: OSMFeature) => f.tags['addr:street'] || (f.tags.highway && f.tags.name),
  'housenumber': (f: OSMFeature) => f.tags['addr:housenumber'],
  'unit': (f: OSMFeature) => f.tags['addr:unit']
};

type OSMFeaturePropertiesProps = {
  schema: JSONSchema,
  onSubmit: (data: any) => any,
  osmFeatureName: string,
  osmImageNote: OSMImageNote,
  nearbyFeatures: OSMFeature[]
}

type OSMFeaturePropertiesState = {
  editMode: boolean
}

const initialState: OSMFeaturePropertiesState = {
  editMode: false
};

export default class OSMFeatureProperties extends React.Component<OSMFeaturePropertiesProps, OSMFeaturePropertiesState> {
  state: OSMFeaturePropertiesState = initialState;

  static defaultProps = {
    osmImageNote: {},
    nearbyFeatures: []
  };

  render() {
    const {schema, osmFeatureName} = this.props;
    const {editMode} = this.state;
    const values = this.valuesFromNote();
    const osmTags = values && values['as_osm_tags'];
    const osmTextId = `${osmFeatureName}-as-osm`;

    return <>
      <p className="mt-2">
        <strong>{osmFeatureName}</strong>
        {!editMode &&
          <>
            {' '}
            <Button size="sm" color="primary" outline className="btn-compact"
                    onClick={() => this.setState({editMode: true})}>Edit</Button>
            {' '}
            {osmTags ?
              <Button size="sm" color="secondary" outline className="btn-compact"
                      onClick={() => this.copyText(osmTextId)}>Copy</Button>
              : values && `${Object.keys(values).length} values`
            }
          </>
        }
      </p>
      {editMode ?
        <Form schema={schema} className="compact"
              formData={values}
              onSubmit={this.onSubmit}/>
        :
        <>
          {osmTags &&
          <textarea id={osmTextId} rows={Object.keys(osmTags).length} className="form-control"
                    value={Object.entries(osmTags).map(([k, v]) => `${k}=${v}`).join('\n')}/>
          }
        </>
      }
    </>
  }

  private copyText(osmTextId: string) {
    (document.getElementById(osmTextId) as HTMLInputElement).select();
    document.execCommand('copy');
  }

  private valuesFromNote() {
    const {osmImageNote, nearbyFeatures, schema, osmFeatureName} = this.props;
    // @ts-ignore
    const propsList = osmImageNote[(this.getPropsFieldName())] || [];
    if (propsList.length) return propsList[0];
    const selectedFeatureIds = osmImageNote.osm_features || [];
    const selectedFeatures = nearbyFeatures.filter((f) => selectedFeatureIds.includes(f.id));
    const allFeatures = selectedFeatures.concat(nearbyFeatures);

    const values: {[k: string]: any} = {};
    Object.keys(schema.properties).forEach(fieldName => {
      const valueFunction = valueFromOSMTags[fieldName];
      if (!valueFunction) return;
      const f = allFeatures.find(f => valueFunction(f))
      if (f) values[fieldName] = valueFunction(f);
    });
    return values;
  }

  private getPropsFieldName() {
    return `${this.props.osmFeatureName.toLowerCase()}_set`;
  }

  onSubmit = (data: any) => {
    const {onSubmit} = this.props;
    const fieldName = this.getPropsFieldName();
    Promise.resolve(onSubmit({[fieldName]: [data.formData]})).then(() => this.setState({editMode: false}));
  }
}
