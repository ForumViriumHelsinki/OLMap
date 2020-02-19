import React from 'react';
// @ts-ignore
import {Button} from "reactstrap";

type PillsSelectionProps = {
  options: string[],
  selected: string[],
  onClick?: (tag: string) => any
}

export default class PillsSelection extends React.Component<PillsSelectionProps> {
  render() {
    const {options, selected} = this.props;
    return options.map(tag =>
      <Button size="sm" outline={!selected.includes(tag)} color="primary" className="rounded-pill mr-1 mb-1"
              key={tag} onClick={(e: Event) => this.onClick(e, tag)}>
        {tag}
      </Button>
    )
  }

  private onClick(e: Event, tag: string) {
    const {onClick} = this.props;
    const target = e.target as HTMLElement;
    target.classList.remove('hasactive');
    target.blur()
    return onClick && onClick(tag);
  }
}
