import React from 'react';
// @ts-ignore
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import {AppContext, Notification} from "components/types";
import sessionRequest from "sessionRequest";
import {notificationSeenUrl, notificationsUrl} from "urls";
import {formatTimestamp} from "utils";
import MapToolButton from "components/osm_image_notes/MapToolButton";


type NotificationsButtonProps = {}

type NotificationsButtonState = {
  open: boolean,
  notifications?: Notification[]
}

const initialState: () => NotificationsButtonState = () => ({
  open: false
});

export default class NotificationsButton extends React.Component<NotificationsButtonProps, NotificationsButtonState> {
  state: NotificationsButtonState = initialState();
  static contextType = AppContext;

  render() {
    const {open, notifications} = this.state;
    if (!notifications || !notifications.length) return null;

    return <ButtonDropdown isOpen={open} toggle={() => this.setState({open: !open})}>
      <DropdownToggle tag="span">
        <MapToolButton icon="inbox">{notifications.length}</MapToolButton>
      </DropdownToggle>
      <DropdownMenu>
        <div className="text-ellipsis" style={{maxWidth: '50vw', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto'}}>
          {notifications.map(notification =>
            <a href={`#/Notes/${notification.comment.image_note}`}
               onClick={() => this.markSeen(notification.id)}
               key={notification.id}>
              <DropdownItem>
                {notification.comment.user || 'Anonymous'}: {notification.comment.comment}{' '}
                <span className="small text-black-50 pl-2">{formatTimestamp(notification.comment.created_at)}</span>
              </DropdownItem>
            </a>
          )}
        </div>
      </DropdownMenu>
    </ButtonDropdown>
  }

  componentDidMount() {
    this.loadNotifications();
  }

  loadNotifications() {
    sessionRequest(notificationsUrl).then((response: any) => {
      if (response.status < 300)
        response.json().then((notifications: Notification[]) => {
          this.setState({notifications});
        });
    })
  }

  markSeen(notificationId: number) {
    sessionRequest(notificationSeenUrl(notificationId), {method: 'PUT'}).then((response: any) => {
      if (response.status < 300) this.loadNotifications()
    })
  }
}
