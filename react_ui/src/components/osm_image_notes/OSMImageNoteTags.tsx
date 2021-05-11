import React from 'react';
import PillsSelection from "util_components/PillsSelection";
import {MapFeatureTypes} from "components/types";
import SearchModal from "util_components/SearchModal";

type OSMImageNoteTagsProps = {
  mapFeatureTypes?: MapFeatureTypes,
  tags: string[],
  onChange: (tags: string[]) => any,
  readOnly?: boolean
}

const defaultTags = ['Problem'];

export default class OSMImageNoteTags extends React.Component<OSMImageNoteTagsProps> {
  render() {
    const {mapFeatureTypes, tags, readOnly} = this.props;
    const tagOptions = mapFeatureTypes ? defaultTags.concat(Object.keys(mapFeatureTypes)) : tags;
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
