import React from 'react';

type CopyTsvWidgetProps = {values: any[], className: string}

type CopyTsvWidgetState = {}

const initialState: CopyTsvWidgetState = {};

let idCounter = 0;

export default class CopyTsvWidget extends React.Component<CopyTsvWidgetProps, CopyTsvWidgetState> {
  state = initialState;

  static defaultProps = {className: ''};

  id = `copyTsv${idCounter++}`;

  render() {
    const {className, values} = this.props;
    const {} = this.state;
    return <>
      <i className={`material-icons text-primary ${className}`}
         style={{cursor: 'pointer'}}
         onClick={this.copyText}>file_copy</i>
      <textarea style={{position: "absolute", width: 0, height: 0, left: -1000}} id={this.id} value={values.join('\t')}/>
    </>;
  }

  copyText = () => {
    (document.getElementById(this.id) as HTMLInputElement).select();
    document.execCommand('copy');
  }
}
