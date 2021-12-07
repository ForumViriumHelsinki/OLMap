import React from 'react';
// @ts-ignore
import _ from 'lodash';
// @ts-ignore
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {AppContext, MapFeatureTypes, OSMImageNote, User} from "components/types";
import MapToolButton from "components/osm_image_notes/MapToolButton";
import sessionRequest from "sessionRequest";
import {recentMappersUrl} from "urls";
import {filterNotes} from "components/osm_image_notes/utils";


type OSMImageNoteFiltersButtonProps = {
  mapFeatureTypes?: MapFeatureTypes,
  onFiltersChanged: (filters: any) => any,
  osmImageNotes?: OSMImageNote[]
}

type OSMImageNoteFiltersButtonState = {
  filters: any,
  counts: any,
  filtersOpen: boolean,
  recentMappers?: User[],
  mappersOpen?: boolean
}

const initialState: () => OSMImageNoteFiltersButtonState = () => ({
  filters: {},
  counts: {},
  filtersOpen: false
});

const _24h = 24 * 3600 * 1000;
const _90d = 90 * _24h;

const filter24h = (note: OSMImageNote) =>
  // @ts-ignore
  new Date(note.modified_at || note.created_at).valueOf() > new Date().valueOf() - _24h;

const filter90d = (note: OSMImageNote) =>
  // @ts-ignore
  new Date(note.modified_at || note.created_at).valueOf() > new Date().valueOf() - _90d;

const checkHeight = (note: OSMImageNote) => note.height;

export default class OSMImageNoteFiltersButton extends React.Component<OSMImageNoteFiltersButtonProps, OSMImageNoteFiltersButtonState> {
  state: OSMImageNoteFiltersButtonState = initialState();
  static contextType = AppContext;

  componentDidMount() {
    sessionRequest(recentMappersUrl).then(response => response.json())
      .then((recentMappers) => this.setState({recentMappers}))
  }

  componentDidUpdate(prevProps: Readonly<OSMImageNoteFiltersButtonProps>) {
    const notes = this.props.osmImageNotes;
    if (notes && (prevProps.osmImageNotes != notes)) {
      const filters = Object.entries(this.filterOptions());
      const counts = filters.map(([k, v]) => [k, filterNotes(v, notes).length]);
      this.setState({counts: Object.fromEntries(counts)})
    }
  }

  filterOptions() {
    const {user} = this.context;
    const {mapFeatureTypes} = this.props;
    const {recentMappers} = this.state;

    return {
      '24h': {newer_than: filter24h},
      '90 days': {newer_than: filter90d},
      'My notes': {created_by: user && user.id},

      'New': {is_processed: false, is_reviewed: false, is_accepted: false},
      'Ready for OSM': {is_processed: false, is_reviewed: false, is_accepted: true},
      'In OSM': {is_processed: true, is_accepted: true, is_reviewed: false},
      'Reviewed': {is_processed: true, is_reviewed: true, is_accepted: true},

      'Delivery instructions': {delivery_instructions: true},
      'Height limitation': {height: checkHeight},
      ...Object.fromEntries(Object.keys(mapFeatureTypes || {}).map((tag) => [tag, {tags: [tag]}])),
      ...Object.fromEntries((recentMappers || []).map((mapper) => [mapper.username, {created_by: mapper.id}]))
    }
  }

  render() {
    const {filters, filtersOpen, recentMappers, mappersOpen, counts} = this.state;
    const {mapFeatureTypes} = this.props;
    const filterOptions = this.filterOptions();

    const FilterItem = ({label}: {label: string}) => {
      // @ts-ignore
      const filter = filterOptions[label];
      const active = _.isMatch(filters, filter) || (filter.tags && (filters.tags || []).includes(filter.tags[0]));
      return <DropdownItem className={active ? 'text-primary pr-1' : 'pr-1'}
                                                                onClick={() => this.toggleFilter(filter)}>
        <span className="float-right small position-relative">{counts[label] || ''}</span>
        <span className="mr-4">{label}</span>
      </DropdownItem>
    };

    return <ButtonDropdown isOpen={filtersOpen} toggle={() => this.setState({filtersOpen: !filtersOpen})}>
      <DropdownToggle tag="span">
        <MapToolButton icon="filter_alt"/>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>Filter</DropdownItem>
        <FilterItem label={'24h'}/>
        <FilterItem label={'90 days'}/>
        <FilterItem label={'My notes'}/>
        {recentMappers &&
          <div className="dropleft btn-group">
            <button className="dropdown-item" onClick={() => this.setState({mappersOpen: !mappersOpen})}>
              By mapper...
            </button>
            {mappersOpen && <DropdownMenu>
              {recentMappers.map(mapper => <FilterItem label={mapper.username} key={mapper.id}/>)}
            </DropdownMenu>}
          </div>
        }
        <DropdownItem divider/>
        <FilterItem label={'New'}/>
        <FilterItem label={'Ready for OSM'}/>
        <FilterItem label={'In OSM'}/>
        <FilterItem label={'Reviewed'}/>
        <DropdownItem divider/>
        <FilterItem label="Delivery instructions"/>
        <FilterItem label="Height limitation"/>
        {mapFeatureTypes && Object.keys(mapFeatureTypes).map((tag) =>
          <FilterItem key={tag} label={tag}/>
        )}
      </DropdownMenu>
    </ButtonDropdown>
  }

  private toggleFilter(filter: any) {
    const filters = Object.assign({}, this.state.filters);

    if (filter.tags) {
      const tag = filter.tags[0];
      if (filters.tags && filters.tags.includes(tag)) {
        filters.tags = _.without(filters.tags, tag);
        if (!filters.tags.length) delete filters.tags;
      }
      else filters.tags = (filters.tags || []).concat(filter.tags);
    }
    else if (_.isMatch(filters, filter)) Object.keys(filter).forEach(k => delete filters[k]);
    else Object.assign(filters, filter);
    this.setFilters(filters);
  }

  setFilters(filters: any) {
    this.setState({filters});
    this.props.onFiltersChanged(filters);
  }
}
