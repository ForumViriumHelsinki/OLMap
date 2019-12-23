import React from 'react';

type ContactProps = {
  title: string,
  name: string,
  phone: string | string[]
}

export default class Contacts extends React.Component<ContactProps> {
  render() {
    const {title, name, phone} = this.props;
    return <div className="mt-1">
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
    </div>;
  }
}
