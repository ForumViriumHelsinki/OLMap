import React from 'react';
import Terms from "components/Terms";
import ResetPasswordForm from "util_components/account/ResetPasswordForm";
import {changePasswordUrl} from "urls";

type ResetPasswordScreenProps = {
  uid: string,
  token: string
};

type ResetPasswordScreenState = {
};

export default class ResetPasswordScreen extends React.Component<ResetPasswordScreenProps, ResetPasswordScreenState> {
  state: ResetPasswordScreenState = {
  };

  render() {
    const {uid, token} = this.props;
    return (
      <div className="container">
        <div className="text-center">
          <img className="w-50" src="images/FORUM_VIRIUM_logo_orange.png" alt="logo"/>
          <h3>Open Logistics Map</h3>
          <p className="lead">Reset password</p>
        </div>
        <ResetPasswordForm changePasswordUrl={changePasswordUrl} token={token} uid={uid}/>
        <Terms/>
      </div>
    );
  }
}
