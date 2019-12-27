import React from "react";
import Map, {MapProps} from "./Map";

export default class MapWidget extends React.Component<MapProps> {
  state = {
    mapOpen: null
  };

  render() {
    const {mapOpen} = this.state;

    return <>
      <i className="material-icons float-right text-primary"
         style={{cursor: 'pointer'}}
         onClick={() => this.setState({mapOpen: true})}>map</i>

      {mapOpen && <Map {...this.props} onClose={() => this.setState({mapOpen: false})}/>}
    </>;
  }
}