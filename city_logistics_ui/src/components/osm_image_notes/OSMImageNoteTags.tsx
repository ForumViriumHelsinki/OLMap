import React from 'react';
import PillsSelection from "util_components/PillsSelection";
import {OSMFeatureProps} from "components/types";
import SearchModal from "util_components/SearchModal";

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
      <>
        <PillsSelection options={tagOptions} selected={tags} onClick={this.toggleTag}/>
        <div className="mt-2">
          <SearchModal
            searchUrl={(searchTerm: string) => `https://wiki.openstreetmap.org/w/index.php?search=${searchTerm}`}
            placeholder="Search OSM" />
        </div>
      </>;
  }

  toggleTag = (tag: string) => {
    const {tags, onChange} = this.props;
    const newTags = tags.slice();
    if (tags.includes(tag)) newTags.splice(tags.indexOf(tag), 1);
    else newTags.push(tag);
    onChange(newTags);
  }
}
