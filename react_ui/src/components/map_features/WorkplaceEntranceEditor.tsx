import React from 'react';
import {MapFeature} from "components/types";
import Map from "util_components/Map";

type WorkplaceEntranceEditorProps = {
  workplace: MapFeature,
  workplaceEntrance?: any
}

type WorkplaceEntranceEditorState = {
}

const initialState: WorkplaceEntranceEditorState = {};

export default class WorkplaceEntranceEditor extends React.Component<WorkplaceEntranceEditorProps, WorkplaceEntranceEditorState> {
  state = initialState;

  render() {
    const {workplace, workplaceEntrance} = this.props;
    const {} = this.state;
    return <div>
      {workplaceEntrance ? 'TBD' :
        <>
          <Map extraLayers={[]} latLng={undefined} showAttribution zoom={19}/>
        </>
      }
    </div>;
  }
}
