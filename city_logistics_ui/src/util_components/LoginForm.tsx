import React, {FormEvent} from 'react';
import sessionRequest, {login, logout} from "sessionRequest";
import ErrorAlert from "util_components/ErrorAlert";

type func = () => any;

export default class LoginForm extends React.Component<{onLogin: func, loginUrl: string}> {
  state = {username: '', password: '', error: false};

  render() {
    return (
      <form onSubmit={this.submit}>
        <ErrorAlert status={this.state.error} message="Login failed. Please try again."/>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="test" className="form-control" name="username"
                 defaultValue={this.state.username}
                 onBlur={this.focusPassword}
                 autoFocus={true}/>
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" className="form-control" name="password" id="password" defaultValue={this.state.password}/>
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
      </form>
    );
  }

  focusPassword() {
    const input = document.getElementById('password');
    if (input) input.focus();
  }

  submit = (e: any) => {
    const {onLogin, loginUrl} = this.props;
    e.preventDefault();
    const formData = new FormData(e.target);
    let data = {};
    // @ts-ignore
    formData.forEach((value: any, key: string) => data[key] = value);
    this.setState({error: false, ...data});
    logout();
    sessionRequest(loginUrl, {method: 'POST', data: data }).then((response) => {
      if (response.status == 200) response.json().then((data) => {
        login(data.key);
        onLogin();
      });
      else this.setState({error: true});
    })
  }
}
