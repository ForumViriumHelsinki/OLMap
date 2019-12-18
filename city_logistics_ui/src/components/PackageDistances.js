import React from 'react';
import settings from "../settings";
import Distances from "util_components/Distances";

export default class PackageDistances extends React.Component {
  render() {
    const {picked_up_time, delivered_time, pickup_at, deliver_to} = this.props.package;
    const {courierLocation} = this.props;

    const courierPoint = courierLocation && {
      name: 'current location', location: courierLocation, icon: settings.markerIcons.currentPosition
    };

    const points=[
      {name: 'pickup at', location: pickup_at, icon: settings.markerIcons.origin},
      {name: 'deliver to', location: deliver_to, icon: settings.markerIcons.destination}
    ];

    if (courierPoint) {
      if (picked_up_time) {
        if (!delivered_time) {
          points.splice(1, 0, courierPoint);
        }
      } else points.splice(0, 0, courierPoint);
    }

    return <Distances {...{points}}/>;
  }
}
