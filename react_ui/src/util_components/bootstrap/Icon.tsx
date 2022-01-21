import React from "react";

type Props = { icon: string, text?: string, className?: string, outline?: boolean, align: string };

export default class Icon extends React.Component<Props> {
  static defaultProps = {align: 'text-bottom'};

  render() {
    const {icon, text, className, outline, align} = this.props;
    return <>
      <i className={`material-icons${outline ? '-outlined' : ''} align-${align} ${className || ''}`}>{icon}</i>
      {text && <><br/><small>{text}</small></>}
    </>;
  }
}
