import React from 'react';
import {formatTimestamp, formatDate, formatTime} from "utils";
import moment from "moment";

type TimeIntervalProps = {
    label: string,
    from: string,
    to: string
}

export default class TimeInterval extends React.Component<TimeIntervalProps> {
    render() {
        const {from, to, label} = this.props;
        const cls = (moment() > moment(to)) ? 'text-danger' : '';

        const fromText = (formatDate(from) == formatDate())
          ? formatTime(from) : formatTimestamp(from);
        const toText = (formatDate(from) == formatDate(to))
          ? formatTime(to) : formatTimestamp(to);

        return <span className={cls}>{label}: {fromText} - {toText}</span>
    }
}
