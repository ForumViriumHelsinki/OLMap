import React from 'react';
// @ts-ignore
import _ from 'lodash';

import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import {changeset} from './types';

const changesetUrl = (id: string) => `https://www.openstreetmap.org/api/0.6/changeset/${id}/download`;

type OSMChangesetSelectionProps = {
  changeset?: changeset,
  onSelect: (changeset?: changeset) => any,
  onCancel?: () => any
}

type OSMChangesetSelectionState = {
  error: boolean
}

const initialState: OSMChangesetSelectionState = {
  error: false
};

export default class OSMChangesetSelection extends React.Component<OSMChangesetSelectionProps, OSMChangesetSelectionState> {
  state = initialState;

  render() {
    const {changeset, onSelect, onCancel} = this.props;
    const {error} = this.state;
    return <>
      <ErrorAlert message="Changeset fetching failed. Check the ID." status={error}/>
      Input changeset ID:
      <input className="form-control" type="number" id="changesetId" defaultValue={changeset && changeset.id}/>
      <div className="mt-2 flex-fill">
        <button className="btn btn-primary" onClick={this.loadChangeset}>Load changeset</button>{' '}
        {onCancel && <button className="btn btn-light" onClick={onCancel}>Cancel</button>}
      </div>
    </>;
  }

  loadChangeset = () => {
    const {onSelect} = this.props;
    const id = (document.getElementById('changesetId') as HTMLInputElement).value;
    if (!id) return onSelect(undefined);
    this.setState({error: false});
    fetch(changesetUrl(id)).then(response => {
      if (response.status >= 400) this.setState({error: true});
      else response.text().then(xmlCode => {
        const dom = new DOMParser().parseFromString(xmlCode, 'application/xml');
        const changeset = {
          id: id,
          created: this.extractNodes(dom.querySelectorAll('create node')),
          modified: this.extractNodes(dom.querySelectorAll('modify node')),
          deleted: this.extractNodes(dom.querySelectorAll('delete node')),
        };
        onSelect(changeset)
      })
    })
  };

  extractNodes(nodeList: NodeListOf<Element>) {
    return _.filter(_.map(nodeList, (node: Element) => {
      // @ts-ignore
      const {id, lat, lon} = node.attributes;
      if (!(lat && lon)) return;
      return {
        type: 'node',
        id: (id && id.value),
        lat: lat.value, lon: lon.value,
        tags: Object.fromEntries(_.map(node.querySelectorAll('tag'), (tag: Element) => {
          // @ts-ignore
          const {k, v} = tag.attributes;
          return [k.value, v.value];
        }))
      };
    }));
  }
}
