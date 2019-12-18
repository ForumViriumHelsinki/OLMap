import React from 'react';
import Confirm from "util_components/Confirm";

class Icon extends React.Component {
  render() {
    return <>
      <i className="material-icons">{this.props.icon}</i><br/>
      <small>{this.props.text}</small>
    </>;
  }
}

class NavItem extends React.Component {
  render() {
    const {icon, text, onClick, active} = this.props;

    return <li className={`nav-item${active ? ' active' : ''}`}>
      <button className="nav-link p-2" href="#" onClick={(e) => {
        e.preventDefault();
        onClick();
      }}>
        <Icon icon={icon} text={text}/>
      </button>
    </li>;
  }
}

export default class FVHTabsUI extends React.Component {
  // Override in subclasses:
  tabs = {
    tabName: {
      header: 'Header',
      ChildComponent: React.Fragment,
      childProps: {},
      icon: 'add_box',
      menuText: 'Tab'
    }
  };

  state = {
    activeTab: 'tabName',
    showLogout: false
  };

  render() {
    const {user} = this.props;
    const {activeTab, showLogout} = this.state;
    const {ChildComponent, header, childProps} = this.tabs[activeTab];

    return (
      <>
        <nav className="navbar navbar-dark bg-primary mb-2">
          <div className="w-25">
            <div className="text-center text-light d-inline-block">
              <Icon icon={user.is_courier ? "directions_bike" : "account_circle"} text={user.username}/>
            </div>
          </div>
          <h5 className="mt-1 text-light">{header}</h5>
          <div className="w-25 d-flex justify-content-end">
            <img style={{maxHeight: 48, marginRight: -16}} src="images/FORUM_VIRIUM_logo_white.png"/>
          </div>
        </nav>
        <div className="container" style={{marginBottom: 96}}>
          <ChildComponent {...childProps}/>
        </div>
        <nav className="navbar fixed-bottom navbar-dark bg-primary">
          <ul className="navbar-nav flex-row nav-fill flex-fill">
            {Object.entries(this.tabs).map(([tabName, {icon, menuText}]) => (
              <NavItem key={tabName} icon={icon} text={menuText} active={activeTab==tabName}
                       onClick={() => this.setState({activeTab: tabName})}/>
            ))}
            <NavItem icon="logout" text="Logout" onClick={() => this.setState({showLogout: true})}/>
          </ul>
        </nav>
        {showLogout &&
          <Confirm title="Log out?"
                   onClose={() => this.setState({showLogout: false})}
                   onConfirm={this.props.onLogout}/>
        }
      </>
    );
  }
}