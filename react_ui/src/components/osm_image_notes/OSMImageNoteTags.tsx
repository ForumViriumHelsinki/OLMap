import React from 'react';
import PillsSelection from "util_components/PillsSelection";
import {MapFeatureTypes} from "components/types";
import Icon from "util_components/bootstrap/Icon";

type OSMImageNoteTagsProps = {
  mapFeatureTypes?: MapFeatureTypes,
  tags: string[],
  onChange: (tags: string[]) => any,
  readOnly?: boolean,
  expanded?: boolean
}

type OSMImageNoteTagsState = {
  editing: boolean
}

const initialState: OSMImageNoteTagsState = {
  editing: false
};

const defaultTags = ['Problem'];

export default class OSMImageNoteTags extends React.Component<OSMImageNoteTagsProps> {
  state = initialState;

  render() {
    const {mapFeatureTypes, tags, readOnly, expanded} = this.props;
    const {editing} = this.state;
    const tagOptions = editing && mapFeatureTypes ? defaultTags.concat(Object.keys(mapFeatureTypes)) : tags;
    return <div className="list-group-item">
      <strong>Tags: </strong>
      {readOnly ?
        (tags.length > 0) ? <PillsSelection options={tags} selected={tags}/>
          : 'No tags selected.'
        :
        <>
          {!expanded && <button className="btn btn-light btn-sm rounded-pill float-right"
                  onClick={() => this.setState({editing: !editing})}>
            <Icon icon={editing ? 'close' : 'edit'}/>
          </button>}
          <PillsSelection options={tagOptions} selected={tags} onClick={this.toggleTag}/>
        </>
      }
    </div>;
  }

  componentDidMount() {
    if (this.props.expanded) this.setState({editing: true})
  }

  toggleTag = (tag: string) => {
    const {editing} = this.state;

    if (!editing) return this.setState({editing: true});

    const {tags, onChange} = this.props;
    const newTags = tags.slice();
    if (tags.includes(tag)) newTags.splice(tags.indexOf(tag), 1);
    else newTags.push(tag);
    onChange(newTags);
  }
}
