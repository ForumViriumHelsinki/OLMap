import React from 'react';
import sessionRequest from "sessionRequest";
import Error from "util_components/Error";

type LiveDataLoaderProps = {
  url: string,
  onLoad: (data: any) => any
}

export default class LiveDataLoader extends React.Component<LiveDataLoaderProps> {
  refreshInterval = 10000;
  _isMounted = false;

  state = {
    items: null,
    error: false
  };
  fetchInterval: NodeJS.Timeout | null = null;

  componentDidMount() {
    this.refreshItems = this.refreshItems.bind(this);
    this.refreshItems();
    this.fetchInterval = setInterval(this.refreshItems, this.refreshInterval);
    this._isMounted = true;
  }

  componentWillUnmount() {
    if (this.fetchInterval) clearInterval(this.fetchInterval);
    this.fetchInterval = null;
    this._isMounted = false;
  }

  refreshItems() {
    const {url, onLoad} = this.props;

    sessionRequest(url).then((response) => {
      if (response.status == 200) response.json().then(this._isMounted ? onLoad : () => null);
      else this.setState({error: true});
    })
  }

  render() {
    const {error} = this.state;
    return <Error status={error} message="Failed to load items. Perhaps try reloading?" />
  }
}