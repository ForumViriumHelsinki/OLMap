import React from "react";
import {
  positioningOptions,
  WWIcon,
} from "components/workplace_wizard/util_components";
import {
  UnloadingPlace,
  WorkplaceEntrance,
} from "components/workplace_wizard/types";

type WWToolbarProps = {
  activeEntrance?: WorkplaceEntrance;
  activeUP?: UnloadingPlace;
  addFeature: (f: positioningOptions) => any;
};

type WWToolbarState = {};

const initialState: WWToolbarState = {};

const toolbarBtn = "btn btn-outline-primary mr-2 btn-compact";

export default class WWToolbar extends React.Component<
  WWToolbarProps,
  WWToolbarState
> {
  state = initialState;

  render() {
    const { activeEntrance, activeUP, addFeature } = this.props;
    const {} = this.state;
    return (
      <div className="mt-2">
        <button
          className={toolbarBtn}
          onClick={() => addFeature("newDeliveryEntrance")}
        >
          <WWIcon
            icon="door_front"
            outline
            text={
              <>
                Uusi toimitus-
                <br />
                sisäänkäynti
              </>
            }
          />
        </button>
        <button
          className={toolbarBtn}
          onClick={() => addFeature("newEntrance")}
        >
          <WWIcon
            icon="door_front"
            className="discrete"
            outline
            text={
              <>
                Uusi muu
                <br />
                sisäänkäynti
              </>
            }
          />
        </button>

        {activeEntrance && (
          <button className={toolbarBtn} onClick={() => addFeature("newUP")}>
            <WWIcon
              icon="local_shipping"
              outline
              text={
                <>
                  Lisää
                  <br />
                  lastauspaikka
                </>
              }
            />
          </button>
        )}
        {activeUP && (
          <button className={toolbarBtn} onClick={() => addFeature("newAP")}>
            <WWIcon
              icon="directions"
              outline
              text={
                <>
                  Lisää
                  <br />
                  reittipiste
                </>
              }
            />
          </button>
        )}
      </div>
    );
  }
}
