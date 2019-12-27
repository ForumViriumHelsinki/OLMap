import React, {FormEvent} from 'react';
import loadData, {login} from "../loadData";
import Error from "util_components/Error";
import Component from "util_components/Component";

type func = () => any;

export default class LoginScreen extends Component<{onLogin: func}> {
  url = '/rest-auth/login/';
  static bindMethods = ['submit'];

  state = {username: '', password: '', error: false};

  render() {
    return (
      <div className="container">
        <div className="text-center">
          <img className="w-50" src="images/FORUM_VIRIUM_logo_orange.png" alt="logo"/>
          <h3>FVH City Logistics</h3>
          <p className="lead text-primary">Sign in</p>
        </div>
        <form onSubmit={this.submit}>
          <Error status={this.state.error} message="Login failed. Please try again."/>
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
      </div>
    );
  }

  focusPassword() {
    const input = document.getElementById('password');
    if (input) input.focus();
  }

  submit(e: any) {
    e.preventDefault();
    const formData = new FormData(e.target);
    let data = {};
    // @ts-ignore
    formData.forEach((value: any, key: string) => data[key] = value);
    this.setState({error: false, ...data});
    loadData(this.url, {method: 'POST', data: data }).then((response) => {
      if (response.status == 200) response.json().then((data) => {
        login(data.key);
        this.props.onLogin();
      });
      else this.setState({error: true});
    })
  }
}
