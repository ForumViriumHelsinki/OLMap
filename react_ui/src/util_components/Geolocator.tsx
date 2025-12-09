import React from 'react';
import Modal, { ModalBody } from 'util_components/bootstrap/Modal';
import settings from '../settings.js';
import { LocationTuple } from './types';

export default class Geolocator extends React.Component<{
  onLocation: (location: LocationTuple) => any;
}> {
  state = {
    geolocationError: null,
  };

  geolocationWatcher: number | null = null;
  mockInterval: NodeJS.Timeout | null = null;

  render() {
    const { geolocationError } = this.state;

    return geolocationError ? (
      <Modal title="Location error" onClose={() => this.setState({ geolocationError: null })}>
        <ModalBody>
          <small>
            <p>Could not access your position:</p>
            <p>{geolocationError}</p>
          </small>
        </ModalBody>
      </Modal>
    ) : (
      ''
    );
  }

  componentDidMount() {
    // @ts-ignore
    const useMockGeolocation = settings.useMockGeolocation;
    if (useMockGeolocation && Array.isArray(useMockGeolocation)) {
      setTimeout(() => this.props.onLocation(useMockGeolocation), 500);
      this.mockInterval = setInterval(() => this.props.onLocation(useMockGeolocation), 10000);
    } else
      this.geolocationWatcher = navigator.geolocation.watchPosition(
        (position) => {
          this.props.onLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => this.setState({ geolocationError: error.message }),
      );
  }

  componentWillUnmount() {
    if (this.geolocationWatcher) navigator.geolocation.clearWatch(this.geolocationWatcher);
    if (this.mockInterval) clearInterval(this.mockInterval);
    this.geolocationWatcher = null;
    this.mockInterval = null;
  }
}
