import React from 'react';
import {getDistance} from 'geolib';
import {Location} from './types';

class Icon extends React.Component<{icon: string}> {
  render() {
    return <i className="material-icons" style={{verticalAlign: "middle"}}>{this.props.icon}</i>;
  }
}

type Point = {
  name: string,
  icon: string,
  location: Location
}

export default class Distances extends React.Component<{points: Point[]}> {
  render() {
    const {points} = this.props;
    return <p className="text-black-50 small">{
      points.map(({name, icon, location}, i) =>
        <React.Fragment key={name}>
          {(i > 0) &&
          <><Icon icon="remove"/>{this.getDistance(location, points[i - 1].location)}<Icon icon="arrow_forward"/></>
          }
          <span className="text-dark"><Icon icon={icon}/></span>
        </React.Fragment>
      )
    }</p>;
  }

  getDistance(p1: Location, p2: Location) {
    const distance = getDistance(p1, p2);
    return (distance > 1000) ? (distance/1000).toFixed(1) + 'km' : distance + 'm'
  }
}
