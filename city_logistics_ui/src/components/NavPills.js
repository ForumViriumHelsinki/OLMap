import React from 'react';

export default class NavPills extends React.Component {
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

  getClassName(nav) {
    const {active, disabled} = this.props;
    return `nav-link${(nav == active) ? ' active' : ''}${disabled.includes(nav) ? ' disabled' : ''}`;
  }
}
