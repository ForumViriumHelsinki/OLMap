import React from "react";

export function CardP({children}: {children: any}) {
  return <p className="card-text">{children}</p>;
}

type CardProps = {
  title: string | React.ReactNode,
  subtitles: string[],
  children: any
}

export default class Card extends React.Component<CardProps> {
  static defaultProps = {
    subtitles: []
  }

  render() {
    const {title, subtitles, children} = this.props;
    return <div className="card mb-2">
      <div className="card-body">
        <h5 className="card-title">{title}</h5>
        {subtitles.map((subtitle, i) =>
          <h6 key={i} className="card-subtitle mb-2 text-muted">{subtitle}</h6>
        )}
        {children}
      </div>
    </div>;
  }
}
