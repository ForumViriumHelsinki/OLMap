import React from 'react';

export default class Component<P> extends React.Component {
  static bindMethods: string[] = [];
  // @ts-ignore
  props: P;

  constructor(props: any) {
    super(props);
    // @ts-ignore
    this.constructor.bindMethods.forEach((method: string) => this[method] = this[method].bind(this))
  }
}