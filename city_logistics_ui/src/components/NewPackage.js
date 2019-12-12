import React from 'react';

import Form from "react-jsonschema-form";
import places from "places.js";
import loadData from "../loadData";
import Spinner from "./Spinner";

import settings from "../settings";
import Error from "./Error";
import moment from "moment";

export default class NewPackage extends React.Component {
  addressFields = ['pickup_at', 'deliver_to'];
  stringField = {type: "string", maxLength: 128, minLength: 1};
  autocompleteFields = {};
  selectedAddresses = {};

  timeFieldDefaults = {
    earliest_pickup_time: 0,
    latest_pickup_time: 4,
    earliest_delivery_time: 0,
    latest_delivery_time: 6,
  };

  state = {
    schema: null,
    error: false
  };

  constructor(props) {
    super(props);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentDidMount() {
    loadData('/rest/outgoing_packages/jsonschema/')
    .then((response) => response.json())
    .then((schema) => this.setSchema(schema))
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {auth, configuration} = settings.algoliaPlaces;
    this.addressFields.forEach((field) => {
        this.autocompleteFields[field] = places({
          ...auth,
          container: document.getElementById(`root_${field}`)
        }).configure(configuration);
        this.autocompleteFields[field].on('change', (e) => this.onAddressChange(field, e.suggestion));
      }
    )
  }

  render() {
    const {schema, error} = this.state;
    if (schema) {
      return <>
        <Error status={error} message="Creation failed. Try again maybe?"/>
        <Form schema={schema} onSubmit={this.onSubmit}/>
      </>
    } else return <Spinner/>
  }

  setSchema(schema) {
    this.addressFields.forEach((field) =>
      schema.properties[field] = {...this.stringField, title: schema.properties[field].title});
    Object.entries(this.timeFieldDefaults).forEach(([field, hours]) =>
      schema.properties[field].default = moment().startOf('hour').add(hours + 1, 'hours').format()
    )
    this.setState({schema});
  }

  onAddressChange(fieldName, address) {
    this.selectedAddresses[fieldName] = {
      street_address: address.name,
      postal_code: address.postcode,
      city: address.city,
      country: address.country,
      lat: address.latlng.lat,
      lon: address.latlng.lng
    };
  }

  onSubmit({formData}) {
    loadData('/rest/outgoing_packages/', {method: 'POST', data: {...formData, ...this.selectedAddresses}})
    .then((response) => {
      if (response.status == 201) this.props.onCreated();
      else this.setState({error: true});
    })
  }
}
