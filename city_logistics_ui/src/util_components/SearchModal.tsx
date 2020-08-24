import React from 'react';
import IFrameModal from "util_components/IFrameModal";

type SearchModalProps = {
  searchUrl: (term: string) => string,
  placeholder?: string
}

type SearchModalState = {
  searchTerm?: string
}

const initialState: SearchModalState = {};

export default class SearchModal extends React.Component<SearchModalProps, SearchModalState> {
  state = initialState;

  render() {
    const {placeholder, searchUrl} = this.props;
    const {searchTerm} = this.state;
    return <>
      <input className="form-control rounded-pill" type="text" placeholder={placeholder || 'Search'}
             onBlur={this.onSearch} onKeyPress={e => (e.key == 'Enter') && this.onSearch(e)}/>
      {searchTerm &&
        <IFrameModal url={searchUrl(searchTerm)}
                     title={`Search: ${searchTerm}`}
                     onClose={() => this.setState({searchTerm: undefined})}/>}
    </>;
  }

  onSearch = (e: any) => {
    this.setState({searchTerm: e.target.value})
  }
}
