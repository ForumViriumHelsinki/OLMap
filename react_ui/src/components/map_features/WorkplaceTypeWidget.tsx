import React from 'react';
import sessionRequest from 'sessionRequest';
import { workplaceTypesUrl } from 'urls';
import Modal from 'util_components/bootstrap/Modal';
import Icon from 'util_components/bootstrap/Icon';

type WorkplaceType = {
  id: number;
  label: string;
  synonyms: string[];
  osm_tags: { [tag: string]: string };
  parents: number[];
  children: WorkplaceType[];
};

class TypeLabel extends React.Component<{ type: WorkplaceType }> {
  private iconUrl(type: WorkplaceType) {
    const [family, typeName] = Object.entries(type.osm_tags)[0];
    return `https://raw.githubusercontent.com/gravitystorm/openstreetmap-carto/master/symbols/${family}/${typeName}.svg`;
  }

  render() {
    const { type } = this.props;
    return (
      <>
        <img
          style={{ height: 16, width: 0 }}
          src={this.iconUrl(type)}
          onError={(e) => (e.target as Element).remove()}
          onLoad={(e) => ((e.target as HTMLElement).style.width = '16px')}
        />{' '}
        {type.label}
      </>
    );
  }
}

type TypeItemProps = {
  type: WorkplaceType;
  onSelect: (t: WorkplaceType) => any;
  level: number;
  expandAll: boolean;
};

class TypeItem extends React.Component<TypeItemProps> {
  state = { expanded: false };

  render() {
    const { type, onSelect, level, expandAll } = this.props;
    const { expanded } = this.state;

    return (
      <div key={type.id}>
        <span
          className="list-group-item list-group-item-action"
          style={{ paddingLeft: 16 * level }}
        >
          <span style={{ width: 32, display: 'inline-block' }}>
            {type.children.length > 0 && !expandAll && (
              <span className="clickable" onClick={() => this.setState({ expanded: !expanded })}>
                <Icon icon={expanded ? 'expand_less' : 'expand_more'} />
              </span>
            )}
          </span>
          <span className="clickable" onClick={() => onSelect(type)}>
            <TypeLabel type={type} />
          </span>
        </span>
        {(expanded || expandAll) &&
          type.children.map((t) => (
            <TypeItem expandAll={expandAll} type={t} level={level + 1} onSelect={onSelect} />
          ))}
      </div>
    );
  }
}

type WorkplaceTypeWidgetProps = {
  value?: number;
  readonly?: boolean;
  onChange: (value: number) => any;
};

type WorkplaceTypeWidgetState = {
  workplaceTypes?: WorkplaceType[];
  expanded?: boolean;
  filter?: string;
};

const initialState: WorkplaceTypeWidgetState = {};

let workplaceTypesCache: WorkplaceType[];
let typesIndex: { [id: number]: WorkplaceType } = {};

export default class WorkplaceTypeWidget extends React.Component<
  WorkplaceTypeWidgetProps,
  WorkplaceTypeWidgetState
> {
  state = initialState;

  componentDidMount() {
    if (workplaceTypesCache) this.setState({ workplaceTypes: workplaceTypesCache });
    else this.fetchWorkplaceTypes();
  }

  render() {
    const { value, onChange } = this.props;
    const { workplaceTypes, expanded, filter } = this.state;
    const currentType = value && typesIndex[value];

    if (!workplaceTypes) return <div className="form-control">Loading...</div>;

    return (
      <div className="form-control">
        <span className="clickable" onClick={() => this.setState({ expanded: true })}>
          {currentType ? <TypeLabel type={currentType} /> : 'Select'}
        </span>
        {expanded && (
          <Modal onClose={() => this.setState({ expanded: false })} title="Select workplace type">
            <input
              className="form-control"
              placeholder="Filter..."
              value={filter}
              style={{ width: '100%' }}
              onChange={(e) => this.setState({ filter: e.target.value })}
            />
            <div className="list-group">
              {this.getFilteredTypes().map((t) => (
                <TypeItem
                  type={t}
                  level={1}
                  expandAll={(filter || '').length > 2}
                  onSelect={(t) => {
                    this.setState({ expanded: false });
                    onChange(t.id);
                  }}
                />
              ))}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  private fetchWorkplaceTypes() {
    sessionRequest(workplaceTypesUrl)
      .then((response) => response.json())
      .then((types: WorkplaceType[]) => {
        typesIndex = Object.fromEntries(types.map((t) => [t.id, t]));
        const workplaceTypes = types.filter((t) => !t.parents.length);

        types.forEach((t) => (t.children = []));
        types.forEach((t) =>
          t.parents.forEach((parentId) =>
            (typesIndex[parentId].children as WorkplaceType[]).push(t),
          ),
        );
        workplaceTypesCache = workplaceTypes;
        this.setState({ workplaceTypes });
      });
  }

  private getFilteredTypes() {
    const { workplaceTypes, filter } = this.state;
    if (!workplaceTypes) return [];
    if (!filter || filter.length < 3) return workplaceTypes;

    const regexp = new RegExp(filter, 'i');
    const filterIndex: { [k: string]: any } = {};
    const recordMatch = (t: WorkplaceType) => {
      filterIndex[t.id] = t;
      t.parents.forEach((id) => recordMatch(typesIndex[id]));
    };

    Object.values(typesIndex)
      .filter((t) => [t.label].concat(t.synonyms).join(' ').search(regexp) > -1)
      .forEach(recordMatch);

    const filterTypes = (types: WorkplaceType[]) =>
      types
        .filter((t) => filterIndex[t.id])
        .map((t) => {
          const filteredT = { ...t };
          filteredT.children = filterTypes(t.children);
          return filteredT;
        });

    return filterTypes(workplaceTypes);
  }
}
