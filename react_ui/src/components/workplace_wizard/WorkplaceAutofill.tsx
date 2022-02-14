import React from 'react';
import {Workplace} from "components/workplace_wizard/types";
import {geocoderFocus} from "components/workplace_wizard/settings";
import {geocoderUrl, workplaceSearchUrl} from "components/workplace_wizard/urls";
import sessionRequest from "sessionRequest";

type WorkplaceAutofillProps = {
  onSelected: (wp: Workplace) => any
}

type LonLat = number[];

type Suggestion = {
  "geometry": {
    "type": string,
    "coordinates": LonLat
  },
  "properties": {
    "id": string,
    "source": string,
    "layer": "street" | "address" | "venue"
    "name": string,
    "housenumber": string,
    "street": string,
    "postalcode": string,
    "confidence": number,
    "distance": number,
    "locality": string,
    "label": string
  }
};

type WorkplaceAutofillState = {
  name?: string,
  street?: string,
  housenumber?: string,
  unit?: string,
  suggestions?: Suggestion[],
  closed?: boolean,
  olmapWorkplaces?: Workplace[]
}

const initialState: WorkplaceAutofillState = {};

export default class WorkplaceAutofill extends React.Component<WorkplaceAutofillProps, WorkplaceAutofillState> {
  state = initialState;
  private blurred?: any;

  render() {
    const {onSelected} = this.props;
    const {name, street, housenumber, unit, closed} = this.state;
    const olmapWorkplaces = this.state.olmapWorkplaces || [];
    const suggestions = this.state.suggestions || [];

    return <>
      <div className="dropdown" onBlur={this.blur} onFocus={this.focus}>
        <form className="form-inline">
          <input type="text" placeholder="Toimipiste" className="form-control col-12" value={name}
                 onChange={(e) => this.onChange('name', e)}/>
          <input type="text" placeholder="Katu" className="form-control col-8" value={street}
                 onChange={(e) => this.onChange('street', e)}/>
          <input type="text" placeholder="Numero" className="form-control col-2" value={housenumber}
                 onChange={(e) => this.onChange('housenumber', e)}/>
          <input type="text" placeholder="Rappu" className="form-control col-2" value={unit}
                 onChange={(e) => this.onChange('unit', e)}/>
        </form>

        {(suggestions.length > 0 || olmapWorkplaces.length > 0) && !closed &&
          <div className="dropdown-menu show">
            {olmapWorkplaces.map((wp) =>
              <button className="dropdown-item" key={wp.id} onClick={() => onSelected(wp)}>
                {wp.name}, {wp.street} {wp.housenumber}
              </button>)}

            {suggestions.map(s => {
              const {label, id} = s.properties;
              return <button className="dropdown-item" key={id} onClick={() => this.onSelect(s)}>{label}</button>
            })}
          </div>
        }
      </div>
      {name && street && housenumber &&
        <button className="btn btn-outline-primary btn-block" onClick={this.onSelectBtn}>Valitse</button>
      }
    </>;
  }

  blur = () => {
    this.blurred = setTimeout((() => this.setState({closed: true})), 500);
  };

  focus = () => {
    if (this.blurred) {
      clearTimeout(this.blurred);
      this.blurred = undefined;
    }
  };

  fetchSuggestions(value: string) {
    const url = `${geocoderUrl}?text=${value}&focus.point.lat=${geocoderFocus.lat}&focus.point.lon=${geocoderFocus.lon}`;
    return fetch(url).then(response => response.json()).then(data => data.features)
  }

  onChange(field: string, e:any) {
    const value = e.target.value;
    this.setState({[field]: value});
    if (['name', 'street'].includes(field) && value.length > 2)
      this.fetchSuggestions(value).then(suggestions => this.setState({suggestions, closed: false}));
    if (field == 'name' && value.length > 2)
      sessionRequest(workplaceSearchUrl(value)).then(r => r.json())
        .then(olmapWorkplaces => this.setState({olmapWorkplaces}))
  }

  onSelectBtn = () => {
    const {name, street, housenumber, unit} = this.state;
    const {onSelected} = this.props;
    if (!(name && street && housenumber)) return;
    this.fetchSuggestions(`${street} ${housenumber}${unit ? ' ' + unit : ''}`).then(suggestions => {
      const [lon, lat] = suggestions[0].geometry.coordinates;
      return onSelected({street, housenumber, unit, name, lon, lat})
    });
  };

  onSelect(suggestion: Suggestion) {
    const {layer, street, housenumber, name, source, id} = suggestion.properties;
    const [lon, lat] = suggestion.geometry.coordinates;
    const {onSelected} = this.props;
    const [nr, unit] = (housenumber || '').split(' ');

    if (layer == 'venue') {
      const osm_feature = source == 'openstreetmap' ? id.split(':')[1] : undefined;
      return onSelected({street, housenumber: nr, unit, name, osm_feature, lon, lat})
    }

    let state = {};
    if (layer == 'address') {
      state = ({street, housenumber: nr, unit});
    }
    if (layer == 'street') state = ({street: name});
    this.setState({...state, suggestions: []})
  }
}
