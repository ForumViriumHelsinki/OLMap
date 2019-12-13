import React from 'react';

export default class Contacts extends React.Component {
  render() {
    const {title, name, phone} = this.props;
    return <p>
      <strong>{title}</strong><br/>
      {name}<br/>
      {(Array.isArray(phone) ? phone: [phone]).map((phoneNr) =>
        <div key={phoneNr} className="mb-2">
          {phoneNr}
          <a className="pl-3" href={`tel:${phoneNr}`}>
            <i className="material-icons" style={{verticalAlign: "middle"}}>phone</i>
          </a>
          <a className="pl-3" href={`sms:${phoneNr}`}>
            <i className="material-icons" style={{verticalAlign: "middle"}}>textsms</i>
          </a>
        </div>
      )}
    </p>;
  }
}
