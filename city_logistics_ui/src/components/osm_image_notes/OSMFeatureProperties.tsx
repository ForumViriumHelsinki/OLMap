import React from 'react';

// @ts-ignore
import Form from "react-jsonschema-form";

import {JSONSchema, OSMImageNote} from "components/types";
// @ts-ignore
import {Button} from "reactstrap";

type OSMFeaturePropertiesProps = {
  schema: JSONSchema,
  onSubmit: (data: any) => any,
  osmFeatureName: string,
  osmImageNote: OSMImageNote
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
    osmImageNote: {}
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
          <textarea id={osmTextId} rows={Object.keys(osmTags).length}
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
    const {osmImageNote} = this.props;
    // @ts-ignore
    const propsList = osmImageNote[(this.getPropsFieldName())] || [];
    return propsList[0];
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
