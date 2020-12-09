import {OSMImageNote, User} from "components/types";

export const userCanEditNote = (user: User | null, osmImageNote: OSMImageNote) => {
  // @ts-ignore
  const is_creator = user && osmImageNote.created_by && user.id == osmImageNote.created_by.id;
  return (user && (user.is_reviewer || is_creator)) || !osmImageNote.id;
};
