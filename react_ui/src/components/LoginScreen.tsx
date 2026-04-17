import React from 'react';
import { loginUrl, registerUrl, passwordResetUrl } from 'urls';
import LoginForm from 'util_components/account/LoginForm';
import RegisterForm from 'util_components/account/RegisterForm';
import Terms from 'components/Terms';

type LoginScreenProps = { onLogin: () => void };

type LoginScreenState = {
  mode: 'login' | 'register';
  showTerms: boolean;
};

export default class LoginScreen extends React.Component<LoginScreenProps, LoginScreenState> {
  state: LoginScreenState = {
    mode: 'login',
    showTerms: false,
  };

  render() {
    const { onLogin } = this.props;
    const { mode } = this.state;

    return (
      <div className="container">
        <div className="text-center">
          <img className="w-50" src="images/FORUM_VIRIUM_logo_orange.png" alt="logo" />
          <h3>Open Logistics Map</h3>
          <p className="lead">
            {mode === 'login' ? (
              <>
                <span className="text-primary">Sign in</span> or{' '}
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => this.setState({ mode: 'register' })}
                >
                  Register
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => this.setState({ mode: 'login' })}
                >
                  Sign in
                </button>{' '}
                or <span className="text-primary">Register</span>
              </>
            )}
          </p>
        </div>
        {mode === 'login' ? (
          <LoginForm loginUrl={loginUrl} onLogin={onLogin} passwordResetUrl={passwordResetUrl} />
        ) : (
          <RegisterForm url={registerUrl} loginUrl={loginUrl} onLogin={onLogin} />
        )}
        <Terms />
      </div>
    );
  }
}
