import React from "react";

export default class Icon extends React.Component<{icon: string, text?: string}> {
  render() {
    const {icon, text} = this.props;
    return <>
      <i className="material-icons align-text-bottom">{icon}</i>
      {text && <><br/><small>{text}</small></>}
    </>;
  }
}
