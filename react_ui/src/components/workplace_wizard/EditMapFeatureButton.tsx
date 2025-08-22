import React from "react";
import ReactDOM from "react-dom";
import { MapFeature } from "components/workplace_wizard/types";
import { JSONSchema } from "components/types";
import { popupBtn, WWIcon } from "components/workplace_wizard/util_components";
import Modal from "util_components/bootstrap/Modal";
import MapFeatureForm from "components/map_features/MapFeatureForm";

type EditBtnProps = {
  mapFeature: MapFeature;
  schema: JSONSchema;
  featureTypeName: string;
  onChange: () => any;
};
type EditBtnState = { editing?: boolean };

export class EditMapFeatureButton extends React.Component<
  EditBtnProps,
  EditBtnState
> {
  state: EditBtnState = {};

  render() {
    const { editing } = this.state;
    const { schema, featureTypeName, mapFeature } = this.props;
    // @ts-ignore
    const fields =
      featureTypeName == "Entrance" ? mapFeature.entrance_fields : mapFeature;
    return (
      <button
        className={popupBtn}
        onClick={() => this.setState({ editing: true })}
      >
        <WWIcon icon="edit_note" outline /> Lisätiedot
        {editing &&
          schema &&
          ReactDOM.createPortal(
            <Modal title="Lisätiedot" onClose={this.onCancel}>
              <div className="p-2">
                <MapFeatureForm
                  schema={schema}
                  onSubmit={this.onSubmit}
                  onCancel={this.onCancel}
                  // @ts-ignore
                  featureTypeName={featureTypeName}
                  mapFeature={fields}
                />
              </div>
            </Modal>,
            document.body,
          )}
      </button>
    );
  }

  onCancel = () => this.setState({ editing: false });

  onSubmit = ({ formData }: any) => {
    if (this.props.featureTypeName == "Entrance")
      Object.assign(this.props.mapFeature, { entrance_fields: formData });
    else Object.assign(this.props.mapFeature, formData);
    this.onCancel();
    this.props.onChange();
  };
}
