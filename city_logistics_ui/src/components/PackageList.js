import React from 'react';
import loadData from "../loadData";
import Error from "./Error";
import Card from "./Card";


export default class PackageList extends React.Component {
  state = {
    packages: null,
    error: false
  };

  componentDidMount() {
    this.refreshPackages();
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
