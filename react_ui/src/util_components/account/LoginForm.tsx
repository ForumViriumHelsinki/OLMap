import React, { FormEvent } from "react";
import sessionRequest, { login, logout } from "sessionRequest";
import ErrorAlert from "util_components/bootstrap/ErrorAlert";
import Modal, { ModalBody } from "util_components/bootstrap/Modal";

type Props = {
  onLogin: () => any;
  loginUrl: string;
  passwordResetUrl: string;
};

type State = {
  username: string;
  password: string;
  error: boolean;
  showPasswordReset: boolean;
  resetEmailSent: boolean;
};

const initialState: State = {
  username: "",
  password: "",
  error: false,
  showPasswordReset: false,
  resetEmailSent: false,
};

export default class LoginForm extends React.Component<Props, State> {
  state = initialState;

  render() {
    const { showPasswordReset, resetEmailSent } = this.state;

    return (
      <>
        <form onSubmit={this.submit}>
          <ErrorAlert
            status={this.state.error}
            message="Login failed. Please try again."
          />
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="test"
              className="form-control"
              name="username"
              defaultValue={this.state.username}
              onBlur={this.focusPassword}
              autoFocus={true}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              id="password"
              defaultValue={this.state.password}
            />

            <a
              className="clickable text-primary"
              onClick={() => this.setState({ showPasswordReset: true })}
            >
              Forgot password?
            </a>
          </div>
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </form>

        {showPasswordReset && (
          <Modal
            onClose={() => this.setState({ showPasswordReset: false })}
            title="Reset password"
          >
            <ModalBody>
              {resetEmailSent ? (
                <>
                  <p>
                    Password reset instruction have been sent to your email.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      this.setState({
                        resetEmailSent: false,
                        showPasswordReset: false,
                      })
                    }
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <p>Enter your email to receive a password reset link:</p>
                  <form onSubmit={this.resetPassword}>
                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="test"
                        className="form-control"
                        name="email"
                        id="reset-email"
                        autoFocus={true}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary">
                      Send password reset email
                    </button>
                  </form>
                </>
              )}
            </ModalBody>
          </Modal>
        )}
      </>
    );
  }

  focusPassword() {
    const input = document.getElementById("password");
    if (input) input.focus();
  }

  submit = (e: any) => {
    const { onLogin, loginUrl } = this.props;
    e.preventDefault();
    const formData = new FormData(e.target);
    let data = {};
    // @ts-ignore
    formData.forEach((value: any, key: string) => (data[key] = value));
    this.setState({ error: false, ...data });
    logout();
    sessionRequest(loginUrl, { method: "POST", data: data }).then(
      (response) => {
        if (response.status == 200)
          response.json().then((data) => {
            login(data.key);
            onLogin();
          });
        else this.setState({ error: true });
      },
    );
  };

  resetPassword = (e: FormEvent) => {
    const { passwordResetUrl } = this.props;
    const email = (document.getElementById("reset-email") as HTMLInputElement)
      .value;

    e.preventDefault();
    sessionRequest(passwordResetUrl, { method: "POST", data: { email } }).then(
      (response) => {
        if (response.status == 200) this.setState({ resetEmailSent: true });
        else this.setState({ error: true });
      },
    );
  };
}
