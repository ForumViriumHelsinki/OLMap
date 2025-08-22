import { OSMImageNote, User } from "components/types";

export const userCanEditNote = (
  user: User | null,
  osmImageNote: OSMImageNote,
) => {
  // @ts-ignore
  const is_creator =
    user && osmImageNote.created_by && user.id == osmImageNote.created_by.id;
  return (user && (user.is_reviewer || is_creator)) || !osmImageNote.id;
};

export const filterNotes = (filters: any, notes: OSMImageNote[]) => {
  if (!filters) return notes;
  const entries = Object.entries(filters || {});

  return notes.filter((note: OSMImageNote) => {
    for (const [key, value] of entries) {
      if (typeof value == "function") {
        if (!value(note)) return false;
      } else if (value instanceof Array)
        for (const item of value) {
          // @ts-ignore
          if (!(note[key] || []).includes(item)) return false;
        }
      // @ts-ignore
      else if (note[key] != value) return false;
    }
    return true;
  });
};
