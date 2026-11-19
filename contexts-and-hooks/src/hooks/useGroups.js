import { useContext } from "react";
import { GroupsContext } from "../context/GroupsContext.jsx";

export function useGroups() {
  const groupsContext = useContext(GroupsContext);
  if (groupsContext === undefined) {
    throw new Error("useGroups must be used within a GroupsProvider.");
  }
  return groupsContext;
}
