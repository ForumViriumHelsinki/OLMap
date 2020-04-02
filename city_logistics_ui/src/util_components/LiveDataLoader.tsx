import React from 'react';
import sessionRequest from "sessionRequest";
import ErrorAlert from "util_components/ErrorAlert";

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

  componentDidUpdate(prevProps: Readonly<LiveDataLoaderProps>) {
    if (prevProps.url != this.props.url) {
      this.setState({error: false});
      this.refreshItems();
    }
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
    return <ErrorAlert status={error} message="Failed to load items. Perhaps try reloading?" />
  }
}
