import React from 'react';

type ToggleProps = {
  on: any;
  off: any;
};

type ToggleState = {
  state: boolean;
};

export default class Toggle extends React.Component<ToggleProps, ToggleState> {
  state: ToggleState = { state: false };

  render() {
    const { on, off, children } = this.props;
    const { state } = this.state;
    return state ? (
      <>
        <span className="clickable" onClick={this.toggleState}>
          {on}
        </span>
        {children}
      </>
    ) : (
      <>
        <a className="btn btn-outline-dark btn-sm btn-compact" onClick={this.toggleState}>
          {off}
        </a>
      </>
    );
  }

  toggleState = (e: React.MouseEvent) => {
    e.preventDefault();
    this.setState({ state: !this.state.state });
  };
}
