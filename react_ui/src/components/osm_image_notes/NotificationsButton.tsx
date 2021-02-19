import React from 'react';
// @ts-ignore
import {ButtonDropdown, DropdownItem, DropdownMenu, DropdownToggle} from "reactstrap";
import Icon from "util_components/bootstrap/Icon";
import {AppContext, Notification} from "components/types";
import sessionRequest from "sessionRequest";
import {notificationSeenUrl, notificationsUrl} from "urls";
import {formatTimestamp} from "utils";


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

  childProps = {
    toolButton: {outline: true, color: "primary", size: "sm", className: 'bg-white'}
  };

  render() {
    const {open, notifications} = this.state;
    const {user} = this.context;
    if (!notifications || !notifications.length) return null;

    return <ButtonDropdown isOpen={open} toggle={() => this.setState({open: !open})}>
      <DropdownToggle {...this.childProps.toolButton}>
        <Icon icon="inbox"/>
        {notifications.length}
      </DropdownToggle>
      <DropdownMenu right>
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
