import React from 'react';
// @ts-ignore
import {HashRouter as Router, Route, Switch, useParams, Redirect} from "react-router-dom";

import sessionRequest, {logout} from "sessionRequest";

import LoginScreen from 'components/LoginScreen';
import LoadScreen from "components/LoadScreen";
import {AppContext, User} from "components/types";
import ResetPasswordScreen from "components/ResetPasswordScreen";
import OSMImageNoteModal from "components/osm_image_notes/OSMImageNoteModal";
import NavBar from "util_components/bootstrap/NavBar";
import Confirm from "util_components/bootstrap/Confirm";
import OSMImageNotesEditor from "components/osm_image_notes/OSMImageNotesEditor";

type UIState = {
  user?: User,
  dataFetched: boolean,
  showLogout: boolean,
  menuOpen: boolean
}

class OLMapUI extends React.Component<{}, UIState> {
  state: UIState = {
    user: undefined,
    dataFetched: false,
    showLogout: false,
    menuOpen: false
  };

  componentDidMount() {
    this.refreshUser();
    window.addEventListener('resize', this.onResize)
  }

  refreshUser() {
    sessionRequest('/rest-auth/user/').then(response => {
      if (response.status == 401) this.setState({user: undefined, dataFetched: true});
      else response.json().then(user => this.setState({user, dataFetched: true}));
    })
  }

  logout = () => {
    sessionRequest('/rest-auth/logout/', {method: 'POST'}).then(response => {
      logout();
      this.setState({user: undefined});
    });
  };

  // @ts-ignore
  onResize = () => document.getElementById('OLMapUI').style.height = window.innerHeight;

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize)
  }

  render() {
    const {user, dataFetched, showLogout} = this.state;

    // @ts-ignore
    const ImageNote = () => <OSMImageNoteModal note={{id: useParams().noteId}} fullScreen />;

    const ResetPassword = () => {
      const params = useParams();
      return <ResetPasswordScreen uid={params.uid} token={params.token}/>;
    };

    return dataFetched ? <AppContext.Provider value={{user}}>
      <Router>
        <Switch>
          <Route path='/login/'>
            {user ? <Redirect to="" /> : <LoginScreen onLogin={() => this.refreshUser()}/>}
          </Route>
          <Route path='/resetPassword/:uid/:token'>
            <ResetPassword/>
          </Route>
          <Route path='/note/:noteId'>
            <ImageNote/>
          </Route>
          <Route exact path=''>
            <div style={{height: window.innerHeight}} className="flex-column d-flex" id="OLMapUI">
              <NavBar onIconClick={this.onNavIconClick}
                      icon={user ? "account_circle" : "login"}
                      iconText={user ? user.username : 'Sign in'}>
                <h5 className="m-2">OLMap</h5>
              </NavBar>
              <div className="flex-grow-1  flex-shrink-1 overflow-auto">
                <OSMImageNotesEditor/>
              </div>
            </div>
          </Route>
        </Switch>
      </Router>
      {showLogout &&
        <Confirm title="Log out?"
                 onClose={() => this.setState({showLogout: false})}
                 onConfirm={this.logout}/>
      }
    </AppContext.Provider> : <LoadScreen/>;
  }

  onNavIconClick = () => {
    if (this.state.user) this.setState({showLogout: true});
    else window.location.hash = '#/login/'
  }
}

export default OLMapUI;
