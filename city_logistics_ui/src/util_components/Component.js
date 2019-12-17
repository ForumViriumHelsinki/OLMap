import React from 'react';

export default class Component extends React.Component {
  constructor() {
    super(...arguments);
    this.constructor.bindMethods.forEach((method) => this[method] = this[method].bind(this))
  }
}