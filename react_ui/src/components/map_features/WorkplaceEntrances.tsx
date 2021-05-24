import React from 'react';
// @ts-ignore

import {MapFeature, OSMImageNote, WorkplaceEntrance} from "components/types";
// @ts-ignore
import {Button} from "reactstrap";
import {OSMFeature} from "util_components/osm/types";
import Modal from "util_components/bootstrap/Modal";
import WorkplaceEntranceEditor from "components/map_features/WorkplaceEntranceEditor";
import {osmFeatureLabel} from "util_components/osm/utils";

type WorkplaceEntrancesProps = {
  osmImageNote: OSMImageNote,
  refreshNote?: () => any,
  workplace: MapFeature
}

type WorkplaceEntrancesState = {
  editingEntrance?: WorkplaceEntrance,
}

const initialState: WorkplaceEntrancesState = {
};

export default class WorkplaceEntrances extends React.Component<WorkplaceEntrancesProps, WorkplaceEntrancesState> {
  state: WorkplaceEntrancesState = initialState;

  static defaultProps = {
    osmImageNote: {}
  };

  render() {
    const {osmImageNote, refreshNote, workplace} = this.props;
    const {editingEntrance} = this.state;

    return <div className="mb-4 mt-1">
      {workplace.name} entrances:{' '}
      {workplace.workplace_entrances.map((we: WorkplaceEntrance, i: number) =>
        <Button size="sm" color="primary" outline className="btn-compact mr-2" key={we.id}
                onClick={() => this.setState({editingEntrance: we})}>
          {we.entrance_data ? osmFeatureLabel({tags: we.entrance_data.as_osm_tags} as OSMFeature)
            : 'Linked entrance'}
        </Button>
      )}
      <Button size="sm" color="primary" outline className="btn-compact"
              onClick={() => this.editNewWPEntrance()}>Link entrance</Button>
      {editingEntrance &&
        <Modal onClose={() => this.setState({editingEntrance: undefined})}
               title={workplace.name + ': link entrance'}>
          <WorkplaceEntranceEditor
            workplace={workplace}
            workplaceEntrance={editingEntrance}
            imageNote={osmImageNote}
            onSubmit={() => {
              refreshNote && refreshNote();
              this.setState({editingEntrance: undefined})}}/>
        </Modal>
      }
    </div>
  }

  editNewWPEntrance() {
    const {workplace} = this.props;
    this.setState({editingEntrance: {workplace: workplace.id}});
  }
}
