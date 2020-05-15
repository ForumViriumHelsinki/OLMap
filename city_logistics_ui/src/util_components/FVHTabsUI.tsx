import React from 'react';
import Confirm from "util_components/bootstrap/Confirm";
import Icon from "util_components/bootstrap/Icon";
import NavBar from "util_components/bootstrap/NavBar";
import {User} from "components/types";

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

type State = { activeTab?: string, showLogout: boolean, menuOpen: boolean };

const initialState: State = {
  showLogout: false,
  menuOpen: false
};

export default class FVHTabsUI extends React.Component<FVHTabsUIProps, State> {
  state = initialState;

  // @ts-ignore
  onResize = () => document.getElementById('FVHTabsUI').style.height = window.innerHeight;

  componentDidMount() {
    window.addEventListener('resize', this.onResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  render() {
    const {user, onLogout, tabs} = this.props;
    const {activeTab, showLogout, menuOpen} = this.state;
    const {ChildComponent, header, childProps, fullWidth} = tabs.find(t => t.header == activeTab) || tabs[0];

    return (
      <div style={{height: window.innerHeight}} className="flex-column d-flex" id="FVHTabsUI">
        <NavBar onIconClick={() => this.setState({showLogout: true})}
                icon={user.is_courier ? "directions_bike" : "account_circle"}
                iconText={user.username}>
          {(tabs.length < 2) ? <h5 className="m-2">{header}</h5> :
            <div className="dropdown show">
              <h5 className="mt-1 clickable" onClick={() => this.setState({menuOpen: !menuOpen})}>
                <Icon icon="menu"/> {header}
              </h5>

              {menuOpen &&
                <div className="dropdown-menu show w-100 mt-3">
                  {tabs.map(({icon, menuText, header}) => (
                    <h5 key={header} className="dropdown-item clickable pt-2 pb-2"
                       onClick={() => this.switchTab(header)}>
                      <Icon icon={icon} className="text-primary mr-2"/> {menuText}
                    </h5>
                  ))}
                </div>
              }
            </div>
          }
        </NavBar>

        <div className={'flex-grow-1  flex-shrink-1 overflow-auto' + (fullWidth ? '' : " container")}>
          <ChildComponent {...childProps}/>
        </div>

        {showLogout &&
          <Confirm title="Log out?"
                   onClose={() => this.setState({showLogout: false})}
                   onConfirm={onLogout}/>
        }
      </div>
    );
  }

  switchTab(header: string) {
    this.setState({activeTab: header, menuOpen: false});
  }
}
