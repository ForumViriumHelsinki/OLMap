import React from 'react';
// @ts-ignore
import _ from 'lodash';
// @ts-ignore
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {AppContext, MapFeatureTypes, OSMImageNote, User} from "components/types";
import MapToolButton from "components/osm_image_notes/MapToolButton";
import sessionRequest from "sessionRequest";
import {recentMappersUrl} from "urls";


type OSMImageNoteFiltersButtonProps = {
  mapFeatureTypes?: MapFeatureTypes,
  onFiltersChanged: (filters: any) => any
}

type OSMImageNoteFiltersButtonState = {
  filters: any,
  filtersOpen: boolean,
  recentMappers?: User[],
  mappersOpen?: boolean
}

const initialState: () => OSMImageNoteFiltersButtonState = () => ({
  filters: {},
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

export default class OSMImageNoteFiltersButton extends React.Component<OSMImageNoteFiltersButtonProps, OSMImageNoteFiltersButtonState> {
  state: OSMImageNoteFiltersButtonState = initialState();
  static contextType = AppContext;

  componentDidMount() {
    sessionRequest(recentMappersUrl).then(response => response.json())
      .then((recentMappers) => this.setState({recentMappers}))
  }

  render() {
    const {filters, filtersOpen, recentMappers, mappersOpen} = this.state;
    const {mapFeatureTypes} = this.props;
    const nonStatusFilters = _.omit(filters, ['is_processed', 'is_reviewed', 'is_accepted']);
    const {user} = this.context;

    return <ButtonDropdown isOpen={filtersOpen} toggle={() => this.setState({filtersOpen: !filtersOpen})}>
      <DropdownToggle tag="span">
        <MapToolButton icon="filter_alt"/>
      </DropdownToggle>
      <DropdownMenu>
        <DropdownItem header>Filter</DropdownItem>
        <DropdownItem className={(filters.newer_than == filter24h) ? 'text-primary' : ''}
                      onClick={() => this.toggleFilter({newer_than: filter24h})}>
          24h
        </DropdownItem>
        <DropdownItem className={(filters.newer_than == filter90d) ? 'text-primary' : ''}
                      onClick={() => this.toggleFilter({newer_than: filter90d})}>
          90 days
        </DropdownItem>
        <DropdownItem className={(filters.created_by) ? 'text-primary' : ''}
                      onClick={() => this.toggleFilter({created_by: user.id})}>
          My notes
        </DropdownItem>
        {recentMappers &&
          <div className="dropleft btn-group">
            <button className="dropdown-item" onClick={() => this.setState({mappersOpen: !mappersOpen})}>
              By mapper...
            </button>
            {mappersOpen && <DropdownMenu>
              {recentMappers.map(mapper =>
                <DropdownItem className={(filters.created_by) ? 'text-primary' : ''} key={mapper.id}
                              onClick={() => this.toggleFilter({created_by: mapper.id})}>
                  {mapper.username}
                </DropdownItem>
              )}
            </DropdownMenu>}
          </div>
        }
        <DropdownItem divider/>
        <DropdownItem className={(filters.is_accepted === false) ? 'text-primary' : ''}
                      onClick={() => this.setFilters(
                        (filters.is_processed === false) ? nonStatusFilters
                        : _.assign({}, nonStatusFilters, {is_processed: false, is_reviewed: false, is_accepted: false}))}>
          New
        </DropdownItem>
        <DropdownItem className={filters.is_accepted ? 'text-primary' : ''}
                      onClick={() => this.setFilters(
                        filters.is_accepted ? nonStatusFilters
                        : _.assign({}, nonStatusFilters, {is_processed: false, is_reviewed: false, is_accepted: true}))}>
          Ready for OSM
        </DropdownItem>
        <DropdownItem className={(filters.is_processed) ? 'text-primary' : ''}
                      onClick={() => this.setFilters(
                        (filters.is_processed) ? nonStatusFilters
                        : _.assign({}, nonStatusFilters, {is_processed: true, is_reviewed: false}))}>
          In OSM
        </DropdownItem>
        <DropdownItem className={(filters.is_reviewed) ? 'text-primary' : ''}
                      onClick={() => this.setFilters(
                        (filters.is_reviewed) ? nonStatusFilters
                        : _.assign({}, nonStatusFilters, {is_reviewed: true}))}>
          Reviewed
        </DropdownItem>
        <DropdownItem divider/>
        {mapFeatureTypes && Object.keys(mapFeatureTypes).map((tag) =>
          <DropdownItem key={tag}
                        className={(filters.tags && filters.tags.includes(tag)) ? 'text-primary' : ''}
                        onClick={() => this.toggleFilter({tags: tag})}>
            {tag}
          </DropdownItem>
        )}
      </DropdownMenu>
    </ButtonDropdown>
  }

  private toggleFilter(filter: any) {
    const filters = Object.assign({}, this.state.filters);

    Object.entries(filter).forEach(([key, value]) => {
      if (key == 'tags') {
        if (filters.tags && filters.tags.includes(value)) {
          filters.tags = _.without(filters.tags, value);
          if (!filters.tags.length) delete filters.tags;
        }
        else filters.tags = (filters.tags || []).concat([value]);
      }
      else if ((filters[key] == value) || (value === undefined)) delete filters[key];
      else filters[key] = value;
    });
    this.setFilters(filters);
  }

  setFilters(filters: any) {
    this.setState({filters});
    this.props.onFiltersChanged(filters);
  }
}
