import React from 'react';
import PillsSelection from "util_components/PillsSelection";
import {OSMFeatureProps} from "components/types";

type OSMImageNoteTagsProps = {
  osmFeatureProperties?: OSMFeatureProps,
  tags: string[],
  onChange: (tags: string[]) => any,
  readOnly?: boolean
}

const defaultTags = ['Problem'];

export default class OSMImageNoteTags extends React.Component<OSMImageNoteTagsProps> {
  render() {
    const {osmFeatureProperties, tags, readOnly} = this.props;
    const tagOptions = defaultTags.concat(osmFeatureProperties ? Object.keys(osmFeatureProperties) : []);
    return readOnly ?
      (tags.length > 0) ? <PillsSelection options={tags} selected={tags}/>
      : 'No tags selected.'
    :
      <PillsSelection options={tagOptions} selected={tags} onClick={this.toggleTag}/>;
  }

  toggleTag = (tag: string) => {
    const {tags, onChange} = this.props;
    const newTags = tags.slice();
    if (tags.includes(tag)) newTags.splice(tags.indexOf(tag), 1);
    else newTags.push(tag);
    onChange(newTags);
  }
}
