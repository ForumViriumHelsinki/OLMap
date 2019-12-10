import React from 'react';
import loadData from "../loadData";
import NewPackage from "./NewPackage";
import OutgoingPackages from "./OutgoingPackages";

class NavItem extends React.Component {
  render() {
    const {icon, text, onClick, active} = this.props;

    return <li className={`nav-item${active ? ' active' : ''}`}>
      <a className="nav-link p-2" href="#" onClick={(e) => {e.preventDefault(); onClick();}}>
        <i className="material-icons">{icon}</i><br/>
        <small>{text}</small>
      </a>
    </li>;
  }
}

export default class FVHTabsUI extends React.Component {
  // Override in subclasses:
  tabs = {
    tabName: {
      header: 'Header',
      ChildComponent: React.Fragment,
      icon: 'add_box',
      menuText: 'Tab'
    }
  };

  state = {
    activeTab: 'tabName'
  };

  render() {
    const {activeTab} = this.state;
    const {ChildComponent, header} = this.tabs[activeTab];

    return (
      <>
        <nav className="navbar navbar-dark bg-primary">
          <div className="w-25"> </div>
          <h5 className="mt-1 text-light">{header}</h5>
          <div className="w-25 d-flex justify-content-end">
            <img style={{maxHeight: 48, marginRight: -16}} src="images/FORUM_VIRIUM_logo_white.png"/>
          </div>
        </nav>
        <ChildComponent/>
        <nav className="navbar fixed-bottom navbar-dark bg-primary">
          <ul className="navbar-nav flex-row nav-fill flex-fill">
            {Object.entries(this.tabs).map(([tabName, {icon, menuText}]) => (
              <NavItem icon={icon} text={menuText} active={activeTab==tabName}
                       onClick={() => this.setState({activeTab: tabName})}/>
            ))}
            <NavItem icon="logout" text="Logout" onClick={this.props.onLogout}/>
          </ul>
        </nav>
      </>
    );
  }
}