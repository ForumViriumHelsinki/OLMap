import React from 'react';
import Modal from "util_components/bootstrap/Modal";

type TermsProps = {}

type TermsState = {showTerms: any}

const initialState: TermsState = {showTerms: false};

export default class Terms extends React.Component<TermsProps, TermsState> {
  state = initialState;

  render() {
    const {showTerms} = this.state;
    return <>
      <p>
        By using this website, you agree to
        our <a onClick={() => this.setState({showTerms: 'terms'})} className="clickable text-primary">
          Usage terms & privacy policy
        </a>, and that any map notes and images published here are placed in the public domain under
        the <a onClick={() => this.setState({showTerms: 'cc0'})} className="clickable text-primary">CC0 License</a>.
      </p>
      {showTerms &&
        <Modal onClose={() => this.setState({showTerms: false})} title="">
          <iframe style={{height: 'calc(100vh - 270px)', width: '100%', border: 'none'}}
                  className="mt-2" src={`/${showTerms}.html`}/>
          <div className="p-2">
            <button className="btn btn-outline-primary btn-block"
                    onClick={() => this.setState({showTerms: false})}>
              Close
            </button>
          </div>
        </Modal>
      }
    </>;
  }
}
