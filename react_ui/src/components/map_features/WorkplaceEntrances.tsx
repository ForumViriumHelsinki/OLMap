import React from "react";
// @ts-ignore

import {
  JSONSchema,
  MapFeature,
  OSMImageNote,
  WorkplaceEntrance,
} from "components/types";
// @ts-ignore
import { Button } from "reactstrap";
import Modal from "util_components/bootstrap/Modal";
import WorkplaceEntranceEditor from "components/map_features/WorkplaceEntranceEditor";

type WorkplaceEntrancesProps = {
  osmImageNote: OSMImageNote;
  refreshNote?: () => any;
  workplace: MapFeature;
  schema: JSONSchema;
};

type WorkplaceEntrancesState = {
  editingEntrance?: WorkplaceEntrance;
};

const initialState: WorkplaceEntrancesState = {};

export default class WorkplaceEntrances extends React.Component<
  WorkplaceEntrancesProps,
  WorkplaceEntrancesState
> {
  state: WorkplaceEntrancesState = initialState;

  static defaultProps = {
    osmImageNote: {},
  };

  render() {
    const { osmImageNote, refreshNote, workplace, schema } = this.props;
    const { editingEntrance } = this.state;

    if (!workplace.workplace_entrances) return false;

    return (
      <div className="mb-1 mt-1">
        {workplace.name} entrances:{" "}
        {workplace.workplace_entrances.map(
          (we: WorkplaceEntrance, i: number) => (
            <Button
              size="sm"
              color="primary"
              outline
              className="btn-compact mr-2"
              key={we.id}
              onClick={() => this.setState({ editingEntrance: we })}
            >
              {we.description || "Linked entrance"}
            </Button>
          ),
        )}
        <Button
          size="sm"
          color="primary"
          outline
          className="btn-compact"
          onClick={() => this.editNewWPEntrance()}
        >
          Link entrance
        </Button>
        {editingEntrance && (
          <Modal
            onClose={() => this.setState({ editingEntrance: undefined })}
            title={workplace.name + ": link entrance"}
          >
            <WorkplaceEntranceEditor
              schema={schema}
              workplace={workplace}
              workplaceEntrance={editingEntrance}
              imageNote={osmImageNote}
              onSubmit={() => {
                refreshNote && refreshNote();
                this.setState({ editingEntrance: undefined });
              }}
            />
          </Modal>
        )}
      </div>
    );
  }

  editNewWPEntrance() {
    const { workplace } = this.props;
    this.setState({ editingEntrance: { workplace: workplace.id as number } });
  }
}
