import React from 'react';
import Form from "react-jsonschema-form";
import {JSONSchema6} from "json-schema";
import Modal, {ModalBody} from "util_components/bootstrap/Modal";
import CreateChangeset from "util_components/osm/api/CreateChangeset";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import {AppContext, OSMEditContextType} from "components/types";
import {osmApiCall} from "util_components/osm/utils";

const schema: JSONSchema6 = {
  type: 'object',
  properties: {
    username: {type: 'string', title: 'OSM Username', default: ''},
    password: {type: 'string', title: 'OSM Password', default: ''},
    comment: {type: 'string', title: 'Changeset comment', default: ''},
  },
  required: ['username', 'password', 'comment']
};

const uiSchema = {
  password: {'ui:widget': 'password'}
};

type OpenOSMChangesetProps = {
  onClose: () => any,
  onCreated: (c: OSMEditContextType) => any
}

type OpenOSMChangesetState = {
  error?: string,
  formData?: any
}

const initialState: OpenOSMChangesetState = {
};

export default class OpenOSMChangesetModal extends React.Component<OpenOSMChangesetProps, OpenOSMChangesetState> {
  state = initialState;
  static contextType = AppContext;

  render() {
    const {onClose} = this.props;
    const {error, formData} = this.state;
    let fields: any;

    if (this.context.osmEditContext) {
      const {username, password, changeset} = this.context.osmEditContext;
      fields = {username, password, comment: changeset ? changeset.comment : ''};
    } else fields = {};


    return <Modal onClose={onClose} title="Create OSM changeset"><ModalBody>
      {error && <ErrorAlert message={error} status />}
      <Form schema={schema} uiSchema={uiSchema} onSubmit={this.onSubmit} formData={{...fields, ...formData}} className="m-0">
        <button className="btn btn-primary btn-block" type="submit">Create changeset</button>
      </Form>
    </ModalBody></Modal>;
  }

  onSubmit = (data: any) => {
    const {username, password, comment} = data.formData;
    const {setOSMContext} = this.context;
    const {onCreated, onClose} = this.props;
    osmApiCall('changeset/create', CreateChangeset, {comment}, {username, password})
    .then(({response, text}) => {
      if (!response.ok) this.setState({error: text, formData: data.formData});
      else {
        const id = parseInt(text);
        const context = {username, password, changeset: {id, comment}};
        setOSMContext(context);
        onCreated(context);
        onClose();
      }
    });
  }
}
