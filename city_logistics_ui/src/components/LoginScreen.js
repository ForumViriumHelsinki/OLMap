import React from 'react';
import loadData, {login} from "../loadData";
import Error from "./Error";


export default class LoginScreen extends React.Component {
  url = '/rest-auth/login/';

  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.state = {username: '', password: ''};
  }

  render() {
    return (
      <div className="container">
        <div className="text-center">
          <img className="w-50" src="images/FORUM_VIRIUM_logo_orange.png"/>
          <h3>FVH City Logistics</h3>
          <p className="lead text-primary">Sign in</p>
        </div>
        <form onSubmit={this.submit}>
          <Error status={this.state.error} message="Login failed. Please try again."/>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="test" className="form-control" name="username"
                   defaultValue={this.state.username}
                   onBlur={() => document.getElementById('password').focus()}
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

  submit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    var data = {};
    formData.forEach((value, key) => data[key] = value);
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
