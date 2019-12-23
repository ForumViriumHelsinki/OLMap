import React from "react";

export default class Icon extends React.Component<{icon: string, text: string}> {
  render() {
    return <>
      <i className="material-icons">{this.props.icon}</i><br/>
      <small>{this.props.text}</small>
    </>;
  }
}
