import React from "react";
import RouteMapModal, {BaseMapProps} from "util_components/RouteMapModal";

export default class MapWidget extends React.Component<BaseMapProps> {
  state = {
    mapOpen: null
  };

  render() {
    const {mapOpen} = this.state;

    return <>
      <i className="material-icons float-right text-primary"
         style={{cursor: 'pointer'}}
         onClick={() => this.setState({mapOpen: true})}>map</i>

      {mapOpen && <RouteMapModal {...this.props} onClose={() => this.setState({mapOpen: false})}/>}
    </>;
  }
}