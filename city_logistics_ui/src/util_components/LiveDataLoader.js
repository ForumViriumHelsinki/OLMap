import React from 'react';
import loadData from "loadData";
import Error from "util_components/Error";


export default class LiveDataLoader extends React.Component {
  refreshInterval = 10000;
  _isMounted = false;

  state = {
    items: null,
    error: false
  };

  componentDidMount() {
    this.refreshItems = this.refreshItems.bind(this);
    this.refreshItems();
    this.fetchInterval = setInterval(this.refreshItems, this.refreshInterval);
    this._isMounted = true;
  }

  componentWillUnmount() {
    clearInterval(this.fetchInterval);
    this.fetchInterval = null;
    this._isMounted = false;
  }

  refreshItems() {
    const {url, onLoad} = this.props;

    loadData(url).then((response) => {
      if (response.status == 200) response.json().then(this._isMounted ? onLoad : () => null);
      else this.setState({error: true});
    })
  }

  render() {
    const {error} = this.state;
    return <Error status={error} message="Failed to load items. Perhaps try reloading?" />
  }
}
