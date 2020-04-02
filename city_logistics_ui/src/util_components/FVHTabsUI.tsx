import React from 'react';
import Confirm from "util_components/Confirm";
import Icon from "util_components/Icon";
import NavBar from "util_components/NavBar";
import {User} from "components/types";

type NavItemProps = {icon: string, text: string, active?: boolean, onClick: () => any}

class NavItem extends React.Component<NavItemProps> {
  render() {
    const {icon, text, onClick, active} = this.props;

    return <li className={`nav-item${active ? ' active' : ''}`}>
      <button className="nav-link p-1 pt-2" onClick={(e) => {
        e.preventDefault();
        onClick();
      }}>
        <Icon icon={icon} text={text}/>
      </button>
    </li>;
  }
}

type FVHTabsUIProps = {
  activeTab: string,
  user: User,
  tabs: {
    ChildComponent: any,
    header: string,
    childProps?: any,
    icon: string,
    menuText: string,
    fullWidth?: boolean
  }[],
  onLogout: () => any
}

export default class FVHTabsUI extends React.Component<FVHTabsUIProps, {activeTab: string, showLogout: boolean}> {
  constructor(props: FVHTabsUIProps) {
    super(props);
    this.state = {
      activeTab: this.props.activeTab,
      showLogout: false
    };
  }

  render() {
    const {user, onLogout, tabs} = this.props;
    const {activeTab, showLogout} = this.state;
    const {ChildComponent, header, childProps, fullWidth} = tabs.find(t => t.header == activeTab) || tabs[0];

    setTimeout(() => window.scrollTo(0, 10), 1000);

    return (
      <div style={{height: window.innerHeight}} className="flex-column d-flex">
        <NavBar header={header}
                icon={user.is_courier ? "directions_bike" : "account_circle"}
                iconText={user.username}/>
        <div className={'flex-grow-1 overflow-auto' + (fullWidth ? '' : " container")}>
          <ChildComponent {...childProps}/>
        </div>
        <nav className="navbar navbar-dark bg-primary p-0">
          <ul className="navbar-nav flex-row nav-fill flex-fill">
            {tabs.map(({icon, menuText, header}) => (
              <NavItem key={header} icon={icon} text={menuText} active={activeTab == header}
                       onClick={() => this.switchTab(header)}/>
            ))}
            <NavItem icon="logout" text="Logout" onClick={() => this.setState({showLogout: true})}/>
          </ul>
        </nav>
        {showLogout &&
        <Confirm title="Log out?"
                 onClose={() => this.setState({showLogout: false})}
                 onConfirm={onLogout}/>
        }
      </div>
    );
  }

  switchTab(header: string) {
    this.setState({activeTab: header});
  }
}
