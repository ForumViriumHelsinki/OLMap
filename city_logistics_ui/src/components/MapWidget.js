import React from "react";
import Map from "./Map";

export default class MapWidget extends React.Component {
  state = {
    mapOpen: null
  };

  render() {
    const {mapOpen} = this.state;
    const {origin, destination, currentPositionIndex} = this.props;

    return <>
      <i className="material-icons float-right text-primary"
         onClick={() => this.setState({mapOpen: true})}>map</i>

      {mapOpen &&
      <Map {...{origin, destination, currentPositionIndex}} onClose={() => this.setState({mapOpen: false})}/>
      }
    </>;
  }
}