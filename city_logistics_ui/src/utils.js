import moment from "moment";

export function formatTimestamp(timestamp) {
  return moment(timestamp).format("D.M.YYYY H:mm");
}