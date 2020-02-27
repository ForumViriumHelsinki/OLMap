import React from 'react';
import OSMImageNotesEditor from "components/osm_image_notes/OSMImageNotesEditor";
import NavBar from "util_components/NavBar";
import {AppContext} from "components/types";
import Confirm from "util_components/Confirm";

type func = () => any;

type OLMapUIProps = {onLogout: func}
type OLMapUIState = {showLogout?: boolean}

export default class OLMapUI extends React.Component<OLMapUIProps, OLMapUIState> {
  static contextType = AppContext;
  state: OLMapUIState = {};

  render() {
    const {user} = this.context;
    const {onLogout} = this.props;
    const {showLogout} = this.state;

    return <div style={{height: window.innerHeight}} className="flex-column d-flex">
      <NavBar header='OLMap' onIconClick={() => this.setState({showLogout: true})}
        icon={user.is_courier ? "directions_bike" : "account_circle"}
        iconText={user.username}/>
      <div className="d-flex flex-grow-1">
        <OSMImageNotesEditor/>
      </div>
      {showLogout &&
        <Confirm title="Log out?"
                 onClose={() => this.setState({showLogout: false})}
                 onConfirm={onLogout}/>
      }
    </div>;
  }
}
