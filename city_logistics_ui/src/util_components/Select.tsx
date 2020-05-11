import React from 'react';

type SelectProps = {
  options: {
    value: any,
    label: string
  }[],
  default?: any,
  onSelect: (value: any) => any
}

type SelectState = {}

const initialState: SelectState = {};

export default class Select extends React.Component<SelectProps, SelectState> {
  state = initialState;

  render() {
    const {options, onSelect} = this.props;

    return <select className="form-control" onChange={({target}) => onSelect(target.value)}>
      {options.map(opt =>
        <option selected={opt.value == this.props.default} value={opt.value} key={opt.value}>
          {opt.label}
        </option>
      )}
    </select>;
  }
}
