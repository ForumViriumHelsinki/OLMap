import React from 'react';
import loadData from "../loadData";
import Error from "./Error";
import Card from "./Card";


export default class PackageList extends React.Component {
  refreshInterval = 10000;

  state = {
    packages: null,
    error: false
  };

  componentDidMount() {
    this.refreshPackages = this.refreshPackages.bind(this);
    this.refreshPackages();
    this.fetchInterval = setInterval(this.refreshPackages, this.refreshInterval);
  }

  componentWillUnmount() {
    clearInterval(this.fetchInterval);
    this.fetchInterval = null;
  }

  refreshPackages() {
    loadData(this.props.url)
    .then((response) => {
      if (response.status == 200) response.json().then((packages) => this.setState({packages}));
      else this.setState({error: true});
    })
  }

  render() {
    const {packageTitle, packageSubtitles, packageContent} = this.props;
    const {error, packages} = this.state;
    return <>
      <Error status={error} message="Failed to load packages. Perhaps try reloading?" />
      {packages && packages.map((item) =>
        <Card key={item.id} title={packageTitle(item)} subtitles={packageSubtitles(item)}>
          {packageContent(item)}
        </Card>
      )}
    </>;
  }
}
