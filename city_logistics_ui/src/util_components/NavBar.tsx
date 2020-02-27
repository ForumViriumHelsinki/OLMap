import React from "react";
import Icon from "util_components/Icon";

type NavBarProps = { icon: string, iconText: string, header: string, onIconClick: () => any };

export default class NavBar extends React.Component<NavBarProps> {
  static defaultProps = {
    onIconClick: () => null
  };

  render() {
    const {icon, iconText, header, onIconClick} = this.props;

    return <nav className="navbar navbar-dark bg-primary p-0">
      <div className="w-25">
        <div className="text-center text-light d-inline-block ml-2 mt-1" onClick={onIconClick}>
          {icon && <Icon icon={icon} text={iconText}/>}
        </div>
      </div>
      <h5 className="mt-1 text-light">{header}</h5>
      <div className="w-25 d-flex justify-content-end">
        <img style={{maxHeight: 48}} src="images/FORUM_VIRIUM_logo_white.png"/>
      </div>
    </nav>;
  }
}