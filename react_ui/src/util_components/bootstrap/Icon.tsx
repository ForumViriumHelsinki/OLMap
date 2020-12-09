import React from "react";

type Props = { icon: string, text?: string, className?: string };

export default class Icon extends React.Component<Props> {
  render() {
    const {icon, text, className} = this.props;
    return <>
      <i className={"material-icons align-text-bottom " + (className || '')}>{icon}</i>
      {text && <><br/><small>{text}</small></>}
    </>;
  }
}
