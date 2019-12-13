import React from 'react';
import Modal, {ModalBody} from "./Modal";
import settings from "../settings";

export default class Geolocator extends React.Component {
  state = {
    geolocationError: null
  };

  geolocationWatcher = null;

  render() {
    const {geolocationError} = this.state;

    return geolocationError ?
      <Modal title="Location error" onClose={() => this.setState({geolocationError: null})}>
        <ModalBody><small>
          <p>Could not access your position:</p>
          <p>{geolocationError}</p>
        </small></ModalBody>
      </Modal> : ''
  }

  componentDidMount() {
    if (settings.useMockGeolocation) {
      this.mockInterval = setInterval(
        () => this.props.onLocation(settings.useMockGeolocation),
        1000)
    } else this.geolocationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        this.props.onLocation([position.coords.latitude, position.coords.longitude])
      },
      (error) => this.setState({geolocationError: error.message})
    );
  }

  componentWillUnmount() {
    if (this.geolocationWatcher) navigator.geolocation.clearWatch(this.geolocationWatcher);
    if (this.mockInterval) clearInterval(this.mockInterval);
    this.geolocationWatcher = null;
    this.mockInterval = null
  }
}
