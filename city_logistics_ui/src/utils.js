import moment from "moment";

export function formatTimestamp(timestamp) {
  return moment(timestamp).format("D.M.YYYY H:mm");
}

export function formatDate(timestamp) {
  return moment(timestamp).format("D.M.YYYY");
}

export function formatTime(timestamp) {
  return moment(timestamp).format("H:mm");
}
