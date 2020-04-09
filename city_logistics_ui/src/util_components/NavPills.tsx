import React from 'react';

type NavPillProps = {
  onSelect: (nav: string, i: number) => any,
  navs: string[],
  active: string,
  disabled: string[]
}

export default class NavPills extends React.Component<NavPillProps> {
  render() {
    const {navs, onSelect} = this.props;
    return <ul className="nav nav-pills nav-justified">
      {navs.map((nav, i) =>
        <li className="nav-item" key={nav}>
          <a className={this.getClassName(nav)} onClick={() => onSelect(nav, i)}>{nav}</a>
        </li>
      )}
    </ul>;
  }

  getClassName(nav: string) {
    const {active, disabled} = this.props;
    return `nav-link p-1 ${(nav == active) ? ' active' : ''}${disabled.includes(nav) ? ' disabled' : ''}`;
  }
}
