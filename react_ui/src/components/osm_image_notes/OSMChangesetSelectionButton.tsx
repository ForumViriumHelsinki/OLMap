import React from "react";
// @ts-ignore
import Modal, { ModalBody } from "util_components/bootstrap/Modal";
import { OSMChangeset } from "util_components/osm/types";
import OSMChangesetSelection from "util_components/osm/OSMChangesetSelection";
import MapToolButton from "components/osm_image_notes/MapToolButton";

type OSMChangesetSelectionButtonProps = {
  selectedChangeset?: OSMChangeset;
  onChangesetSelected: (changeset?: OSMChangeset) => any;
};

type OSMChangesetSelectionButtonState = {
  selectChangeset: boolean;
};

const initialState: () => OSMChangesetSelectionButtonState = () => ({
  selectChangeset: false,
});

export default class OSMChangesetSelectionButton extends React.Component<
  OSMChangesetSelectionButtonProps,
  OSMChangesetSelectionButtonState
> {
  state: OSMChangesetSelectionButtonState = initialState();

  render() {
    const { selectChangeset } = this.state;
    const { selectedChangeset, onChangesetSelected } = this.props;

    return (
      <>
        {selectChangeset && (
          <Modal
            title="Select OSM changeset"
            onClose={() => this.setState({ selectChangeset: false })}
          >
            <ModalBody>
              <OSMChangesetSelection
                changeset={selectedChangeset}
                onCancel={() => this.setState({ selectChangeset: false })}
                onSelect={(cs) => {
                  this.setState({ selectChangeset: false });
                  onChangesetSelected(cs);
                }}
              />
            </ModalBody>
          </Modal>
        )}
        <MapToolButton
          icon="compare_arrows"
          onClick={() => this.setState({ selectChangeset: true })}
        />
      </>
    );
  }
}
