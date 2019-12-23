import React from "react";
import Icon from "util_components/Icon";

export default class NavBar extends React.Component<{icon: string, iconText: string, header: string}> {
  render() {
    const {icon, iconText, header} = this.props;

    return <nav className="navbar navbar-dark bg-primary mb-2">
      <div className="w-25">
        <div className="text-center text-light d-inline-block">
          {icon && <Icon icon={icon} text={iconText}/>}
        </div>
      </div>
      <h5 className="mt-1 text-light">{header}</h5>
      <div className="w-25 d-flex justify-content-end">
        <img style={{maxHeight: 48, marginRight: -16}} src="images/FORUM_VIRIUM_logo_white.png"/>
      </div>
    </nav>;
  }
}