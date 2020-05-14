import React from 'react';
import LiveDataLoader from "util_components/LiveDataLoader";
import CenteredSpinner from "util_components/bootstrap/CenteredSpinner";

type LiveListProps = {
  url: string,
  item: (item: any) => any
}

type LiveListState = {
  items?: any[],
  url?: string
}

const initialState: LiveListState = {};

export default class LiveList extends React.Component<LiveListProps, LiveListState> {
  state = initialState;
  dataLoader = React.createRef<LiveDataLoader>();

  render() {
    const {url, item} = this.props;
    const {items} = this.state;
    return <>
      <LiveDataLoader ref={this.dataLoader} url={url} onLoad={(items) => this.setState({items, url})}/>
      <div className="mt-2">
        {items && (this.state.url == url) ?
          items.length ?
            items.map((itemData, i) =>
              <div className="mb-2" key={i}>{item(itemData)}</div>)
            : <p>No items.</p>
        : <CenteredSpinner/>}
      </div>
    </>;
  }

  refreshItems() {
    if (this.dataLoader.current) this.dataLoader.current.refreshItems()
  }
}
