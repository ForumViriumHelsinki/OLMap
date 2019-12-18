import React from 'react';
import Confirm from "util_components/Confirm";
import Icon from "util_components/Icon";
import NavBar from "util_components/NavBar";

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
    const {user, onLogout} = this.props;
    const {activeTab, showLogout} = this.state;
    const {ChildComponent, header, childProps} = this.tabs[activeTab];

    return (
      <>
        <NavBar header={header}
                icon={user.is_courier ? "directions_bike" : "account_circle"}
                iconText={user.username}/>
        <div className="container" style={{marginBottom: 96}}>
          <ChildComponent {...childProps}/>
        </div>
        <nav className="navbar fixed-bottom navbar-dark bg-primary">
          <ul className="navbar-nav flex-row nav-fill flex-fill">
            {Object.entries(this.tabs).map(([tabName, {icon, menuText}]) => (
              <NavItem key={tabName} icon={icon} text={menuText} active={activeTab == tabName}
                       onClick={() => this.setState({activeTab: tabName})}/>
            ))}
            <NavItem icon="logout" text="Logout" onClick={() => this.setState({showLogout: true})}/>
          </ul>
        </nav>
        {showLogout &&
        <Confirm title="Log out?"
                 onClose={() => this.setState({showLogout: false})}
                 onConfirm={onLogout}/>
        }
      </>
    );
  }
}