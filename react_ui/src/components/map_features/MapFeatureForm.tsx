import React from "react";
import Form from "react-jsonschema-form";

import { JSONSchema, MapFeature } from "components/types";
// @ts-ignore
import { Button } from "reactstrap";
import ConfirmButton from "util_components/bootstrap/ConfirmButton";
import WorkplaceTypeWidget from "components/map_features/WorkplaceTypeWidget";

type MapFeatureFormProps = {
  schema: JSONSchema;
  onSubmit: (data: any) => any;
  onCancel: () => any;
  onDelete?: () => any;
  featureTypeName: string;
  mapFeature: MapFeature;
};

type MapFeatureFormState = {};

const initialState: MapFeatureFormState = {};

type AnyObject = { [key: string]: any };

const customWidgets: AnyObject = {
  Workplace: { type: WorkplaceTypeWidget },
};

export const omitFields: AnyObject = {
  UnloadingPlace: ["entrances"],
  Workplace: ["workplace_entrances"],
};

export default class MapFeatureForm extends React.Component<
  MapFeatureFormProps,
  MapFeatureFormState
> {
  state: MapFeatureFormState = initialState;

  render() {
    const {
      schema,
      featureTypeName,
      mapFeature,
      onSubmit,
      onCancel,
      onDelete,
    } = this.props;

    const filteredSchema = { ...schema };
    // Don't show OSM Feature as a silly integer input field in the form:
    const { osm_feature, ...filteredProps } = schema.properties;
    filteredSchema.properties = omitFields[featureTypeName]
      ? Object.fromEntries(
          Object.entries(filteredProps).filter(
            ([k, v]) => !omitFields[featureTypeName].includes(k),
          ),
        )
      : filteredProps;

    return (
      <Form
        schema={filteredSchema}
        uiSchema={this.getUISchema()}
        className="compact"
        formData={mapFeature}
        onSubmit={onSubmit}
      >
        <Button
          size="sm"
          color="primary"
          type="submit"
          className="btn-compact pl-4 pr-4 mr-2"
        >
          Done
        </Button>
        <Button
          tag="span"
          size="sm"
          color="secondary"
          outline
          className="btn-compact pl-4 pr-4"
          onClick={onCancel}
        >
          Cancel
        </Button>
        {onDelete && (
          <ConfirmButton
            onClick={onDelete}
            className="btn-outline-danger btn-compact btn-sm float-right"
            confirm={`Really delete ${featureTypeName}?`}
          >
            Delete
          </ConfirmButton>
        )}
      </Form>
    );
  }

  private getUISchema() {
    const { schema, featureTypeName } = this.props;
    const radioFields = Object.entries(schema.properties)
      .filter(
        ([field, spec]: [string, any]) =>
          String(spec.type) === String(["boolean", "null"]),
      )
      .map(([field, spec]) => {
        return [field, { "ui:widget": "radio" }];
      });
    const customWidgetsForSchema = customWidgets[featureTypeName] || {};
    const customFields = Object.entries(schema.properties)
      .filter(([field, spec]: [string, any]) => customWidgetsForSchema[field])
      .map(([field, spec]: [string, any]) => {
        return [field, { "ui:widget": customWidgetsForSchema[field] }];
      });
    const textFields = Object.entries(schema.properties)
      .filter(
        ([field, spec]: [string, any]) =>
          spec.type === "string" && !spec.maxLength && !spec.enum,
      )
      .map(([field, spec]: [string, any]) => {
        return [field, { "ui:widget": "textarea" }];
      });
    return Object.fromEntries(
      radioFields.concat(customFields).concat(textFields),
    );
  }
}
