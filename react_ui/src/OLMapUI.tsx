import React from 'react';
// @ts-ignore
import { HashRouter as Router, Route, Switch, useParams, Redirect } from 'react-router-dom';

import sessionRequest, { logout } from 'sessionRequest';

import LoginScreen from 'components/LoginScreen';
import LoadScreen from 'components/LoadScreen';
import { AppContext, User } from 'components/types';
import ResetPasswordScreen from 'components/ResetPasswordScreen';
import OSMImageNoteModal from 'components/osm_image_notes/OSMImageNoteModal';
import NavBar from 'util_components/bootstrap/NavBar';
import OSMImageNotesEditor from 'components/osm_image_notes/OSMImageNotesEditor';
import ImageNotesContextProvider from 'components/osm_image_notes/ImageNotesContextProvider';
import WorkplaceWizard from 'components/workplace_wizard/WorkplaceWizard';

type UIState = {
  user?: User;
  dataFetched: boolean;
  showLogout: boolean;
  menuOpen: boolean;
};

class OLMapUI extends React.Component<{}, UIState> {
  state: UIState = {
    user: undefined,
    dataFetched: false,
    showLogout: false,
    menuOpen: false,
  };

  componentDidMount() {
    this.refreshUser();
    window.addEventListener('resize', this.onResize);
  }

  refreshUser() {
    sessionRequest('/rest-auth/user/').then((response) => {
      if (response.status == 401) this.setState({ user: undefined, dataFetched: true });
      else response.json().then((user) => this.setState({ user, dataFetched: true }));
    });
  }

  logout = () => {
    sessionRequest('/rest-auth/logout/', { method: 'POST' }).then((response) => {
      logout();
      this.setState({ user: undefined });
    });
  };

  onResize = () => {
    const el = document.getElementById('OLMapUI');
    // @ts-ignore
    if (el) el.style.height = window.innerHeight;
  };

  componentWillUnmount() {
    window.removeEventListener('resize', this.onResize);
  }

  render() {
    const { user, dataFetched } = this.state;

    // @ts-ignore
    const ImageNote = () => {
      const { noteId } = useParams<{ noteId: string }>();
      return (
        <OSMImageNoteModal
          note={{ id: noteId ? parseInt(noteId, 10) : undefined }}
          onClose={() => window.history.back()}
          fullScreen
        />
      );
    };

    const ResetPassword = () => {
      const params = useParams() as any;
      return <ResetPasswordScreen uid={params.uid} token={params.token} />;
    };

    const WithNavBar: React.FC<{ children?: React.ReactNode }> = (props) => (
      <div style={{ height: window.innerHeight }} className="flex-column d-flex" id="OLMapUI">
        <NavBar user={user} logout={this.logout}>
          <h5 className="m-2">OLMap</h5>
        </NavBar>
        <div className="flex-grow-1 flex-shrink-1 overflow-auto">{props.children}</div>
      </div>
    );

    const MapUI = (props: {
      selectedNoteId?: number;
      newNote?: boolean;
      osmFeatures?: number[];
    }) => (
      <WithNavBar>
        <ImageNotesContextProvider>
          <OSMImageNotesEditor {...props} />
        </ImageNotesContextProvider>
      </WithNavBar>
    );

    return dataFetched ? (
      <AppContext.Provider value={{ user }}>
        <Router>
          <Switch>
            <Route path="/login/">
              {user ? <Redirect to="" /> : <LoginScreen onLogin={() => this.refreshUser()} />}
            </Route>
            <Route path="/resetPassword/:uid/:token">
              <ResetPassword />
            </Route>
            <Route
              path="/ww/osm/:osmType/:osmId"
              render={(props: any) => {
                if (!user) return <Redirect to="/login/" />;
                const { osmType, osmId } = props.match.params;
                return (
                  <WithNavBar>
                    <WorkplaceWizard {...{ osmType, osmId }} />
                  </WithNavBar>
                );
              }}
            />
            <Route
              path="/ww/id/:olmapId"
              render={(props: any) => {
                if (!user) return <Redirect to="/login/" />;
                const { olmapId } = props.match.params;
                return (
                  <WithNavBar>
                    <WorkplaceWizard {...{ olmapId }} />
                  </WithNavBar>
                );
              }}
            />
            <Route
              path="/ww/osm/:osmType/:osmId"
              render={(props: any) => {
                if (!user) return <Redirect to="/login/" />;
                const { osmType, osmId } = props.match.params;
                return (
                  <WithNavBar>
                    <WorkplaceWizard {...{ osmType, osmId }} />
                  </WithNavBar>
                );
              }}
            />
            <Route path="/ww/">
              {!user ? (
                <Redirect to="/login/" />
              ) : (
                <WithNavBar>
                  <WorkplaceWizard />
                </WithNavBar>
              )}
            </Route>
            <Route path="/note/:noteId">{!user ? <Redirect to="/login/" /> : <ImageNote />}</Route>
            <Route
              path="/Notes/new/:osmId(\d+)?/"
              render={(props: any) => {
                if (!user) return <Redirect to="/login/" />;
                const { osmId } = props.match.params;
                return <MapUI newNote osmFeatures={osmId && [Number(osmId)]} />;
              }}
            />
            <Route
              path="/Notes/:noteId(\d+)?"
              render={(props: any) => {
                if (!user) return <Redirect to="/login/" />;
                return (
                  <MapUI
                    selectedNoteId={props.match.params.noteId && Number(props.match.params.noteId)}
                  />
                );
              }}
            />
            <Route>
              <Redirect to="/Notes/" />
            </Route>
          </Switch>
        </Router>
      </AppContext.Provider>
    ) : (
      <LoadScreen />
    );
  }
}

export default OLMapUI;
