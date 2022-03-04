import React from "react";
import Icon from "util_components/bootstrap/Icon";
import {User} from "components/types";
import Confirm from "util_components/bootstrap/Confirm";

type NavBarProps = {
  user?: User,
  logout: () => any
};

type NavBarState = {
  showLogout?: boolean,
  showMenu?: boolean
};

export default class NavBar extends React.Component<NavBarProps, NavBarState> {
  state: NavBarState = {};

  render() {
    const {user, children, logout} = this.props;
    const {showMenu, showLogout} = this.state;
    const icon = user ? "account_circle" : "login";
    const iconText = user ? user.username : 'Sign in';
    const iconCls = "text-center d-inline-block ml-2 mt-1 clickable";
    const showCls = showMenu ? ' show' : '';

    return <nav className="navbar navbar-dark bg-primary text-light p-0 flex-shrink-0">
      <div className="w-25">
        <div className={"dropdown d-inline-block" + showCls}>
          <button className="btn btn-primary p-1" onClick={() => this.setState({showMenu: !showMenu})}>
            <Icon icon="menu" text={user ? user.username: ''}></Icon>
          </button>
          <div className={"dropdown-menu" + showCls}>
            <a className="dropdown-item" href="#/ww/">
              <Icon icon="location_city"/> Workplace delivery instructions
            </a>
            <a className="dropdown-item" href="#/Notes/">
              <Icon icon="map"/> Data points map
            </a>
            {user ?
              <button className="dropdown-item" onClick={logout}>
                <Icon icon="account_circle"/> Log out {user.username}
              </button>
            :
              <a className="dropdown-item" href="#/login/">
                <Icon icon="login"/> Log in
              </a>
            }
          </div>
        </div>
      </div>
      <div className="w-50 text-center">{children}</div>
      <div className="w-25 d-flex justify-content-end">
        <img style={{maxHeight: 48}} src="images/FORUM_VIRIUM_logo_white.png"/>
      </div>
     {showLogout &&
        <Confirm title="Log out?"
                 onClose={() => this.setState({showLogout: false})}
                 onConfirm={logout}/>
      }
    </nav>;
  }
}