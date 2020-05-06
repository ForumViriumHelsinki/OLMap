import moment from "moment";
import {Package} from "components/types";

export const packageAsTsv = (item: Package) => {
    const {
      earliest_pickup_time, sender, recipient, recipient_phone, delivery_instructions, deliver_to
    } = item;

    return [
      moment(earliest_pickup_time).format('DD.MM.YYYY'),
      sender.username,
      moment(earliest_pickup_time).format('HH:mm'),
      '>>>>',
      `${deliver_to.street_address}, ${recipient}, ${recipient_phone}`,
      delivery_instructions];
}
