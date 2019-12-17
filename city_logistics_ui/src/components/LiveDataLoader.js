import React from 'react';
import loadData from "../loadData";
import Error from "./Error";


export default class LiveDataLoader extends React.Component {
  refreshInterval = 10000;

  state = {
    items: null,
    error: false
  };

  componentDidMount() {
    this.refreshItems = this.refreshItems.bind(this);
    this.refreshItems();
    this.fetchInterval = setInterval(this.refreshItems, this.refreshInterval);
  }

  componentWillUnmount() {
    clearInterval(this.fetchInterval);
    this.fetchInterval = null;
  }

  refreshItems() {
    const {url, onLoad} = this.props;

    loadData(url).then((response) => {
      if (response.status == 200) response.json().then(onLoad);
      else this.setState({error: true});
    })
  }

  render() {
    const {error} = this.state;
    return <Error status={error} message="Failed to load items. Perhaps try reloading?" />
  }
}
