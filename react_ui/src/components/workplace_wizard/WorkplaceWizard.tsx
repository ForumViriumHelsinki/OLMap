import React from 'react';
import WorkplaceAutofill from 'components/workplace_wizard/WorkplaceAutofill';
import { Workplace } from 'components/workplace_wizard/types';
import { olmapWorkplaceByOSMUrl, workplaceUrl } from 'components/workplace_wizard/urls';
import * as L from 'leaflet';

import './WorkplaceWizard.scss';
import sessionRequest from 'sessionRequest';
import Icon from 'util_components/bootstrap/Icon';
import WorkplaceWizardEditor from 'components/workplace_wizard/WorkplaceWizardEditor';
import { AppContext } from 'components/types';
import { overpassQuery } from 'util_components/osm/utils';

type WorkplaceWizardProps = {
  osmType?: 'node' | 'way' | 'relation';
  osmId?: string;
  olmapId?: string;
};

type WorkplaceWizardState = {
  workplace?: Workplace;
};

const initialState: WorkplaceWizardState = {};

export default class WorkplaceWizard extends React.Component<
  WorkplaceWizardProps,
  WorkplaceWizardState
> {
  state = initialState;

  map?: L.Map = undefined;

  render() {
    const { workplace } = this.state;

    return (
      <div className="p-2">
        <h4>
          {workplace ? (
            <>
              <Icon icon="location_city" align="middle" /> {workplace.name}
            </>
          ) : (
            'Toimipisteen'
          )}{' '}
          toimitusohjeet
          {workplace && (
            <button className="float-right btn btn-light" onClick={this.closeWorkplace}>
              X
            </button>
          )}
        </h4>
        {workplace ? (
          <WorkplaceWizardEditor workplace={workplace} onClose={this.closeWorkplace} />
        ) : (
          <WorkplaceAutofill onSelected={this.onSelected} />
        )}
      </div>
    );
  }

  componentDidMount() {
    const { osmType, osmId, olmapId } = this.props;
    if (osmType && osmId) {
      overpassQuery(`(${osmType}(${osmId});)->.result;`).then(([osmWorkplace]) => {
        let { lat, lon, tags, bounds } = osmWorkplace;
        if (bounds && !lat) {
          lat = (bounds.minlat + bounds.maxlat) / 2;
          lon = (bounds.minlon + bounds.maxlon) / 2;
        }
        this.onSelected({
          lon,
          lat,
          osm_feature: osmId,
          name: tags.name,
          street: tags['addr:street'],
          housenumber: tags['addr:housenumber'],
          unit: tags['addr:unit'],
        });
      });
    } else if (olmapId) {
      this.loadWorkplace(workplaceUrl(olmapId));
    } else {
      const state = JSON.parse(localStorage.getItem('wwState') || '{}');
      this.setState(state);
    }
  }

  closeWorkplace = () => this.storeState({ workplace: undefined });

  storeState(state: WorkplaceWizardState) {
    this.setState(state);
    localStorage.setItem('wwState', JSON.stringify({ workplace: this.state.workplace }));
  }

  onSelected = (workplace: Workplace) => {
    const { osm_feature } = workplace;
    this.storeState({ workplace });

    if (!osm_feature) return;

    this.loadWorkplace(olmapWorkplaceByOSMUrl(osm_feature));
  };

  loadWorkplace = (url: string) => {
    sessionRequest(url).then((response) => {
      if (response.status != 200) return;
      response.json().then((workplace) => {
        this.storeState({ workplace });
      });
    });
  };
}
