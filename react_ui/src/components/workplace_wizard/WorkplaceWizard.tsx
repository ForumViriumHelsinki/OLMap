import React from 'react';
import WorkplaceAutofill from "components/workplace_wizard/WorkplaceAutofill";
import {Workplace} from "components/workplace_wizard/types";
import {olmapWorkplaceByOSMUrl} from "components/workplace_wizard/urls";
import * as L from "leaflet";

import './WorkplaceWizard.scss';
import sessionRequest from "sessionRequest";
import Icon from "util_components/bootstrap/Icon";
import WorkplaceWizardEditor from "components/workplace_wizard/WorkplaceWizardEditor";


type WorkplaceWizardProps = {}

type WorkplaceWizardState = {
  workplace?: Workplace,
}

const initialState: WorkplaceWizardState = {};

export default class WorkplaceWizard extends React.Component<WorkplaceWizardProps, WorkplaceWizardState> {
  state = initialState;

  map?: L.Map = undefined;

  render() {
    const {} = this.props;
    const {workplace} = this.state;

    return <div className="p-2">
      <h4>
        {workplace ? <><Icon icon="location_city" align="middle"/> {workplace.name}</> : 'Toimipisteen'} toimitusohjeet
        {workplace &&
          <button className="float-right btn btn-light"
                  onClick={this.closeWorkplace}>X</button> }
      </h4>
      {workplace ? <WorkplaceWizardEditor workplace={workplace} onClose={this.closeWorkplace}/>
      : <WorkplaceAutofill onSelected={this.onSelected}/>}
    </div>;
  }

  componentDidMount() {
    const state = JSON.parse(localStorage.getItem('wwState') || '{}');
    this.setState(state);
  }

  closeWorkplace = () =>
    this.storeState({workplace: undefined});

  storeState(state: WorkplaceWizardState) {
    this.setState(state);
    localStorage.setItem('wwState', JSON.stringify({workplace: this.state.workplace}));
  }

  onSelected = (workplace: Workplace) => {
    const {osm_feature} = workplace;
    this.storeState({workplace});

    if (!osm_feature) return;

    sessionRequest(olmapWorkplaceByOSMUrl(osm_feature))
    .then(response => {
      if (response.status != 200) return;
      response.json().then((workplace) => {
        this.storeState({workplace});
      })
    })
  };
}
