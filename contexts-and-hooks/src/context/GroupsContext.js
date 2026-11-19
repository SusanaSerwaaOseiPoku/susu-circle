import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useFetch } from "../hooks/useFetch.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import {
  addMember as addMemberToGroups,
  createGroup as createGroupInGroups,
  recordContribution as recordGroupContribution,
  removeMember as removeMemberFromGroups,
  togglePaid as toggleMemberPaid,
} from "../state/groupOperations.js";

const STORAGE_KEY = "susu-circle-groups";
const EMPTY_GROUPS = [];

export const GroupsContext = createContext(undefined);

export function GroupsProvider({ children }) {
  const [
    storedGroups,
    setStoredGroups,
    hasStoredGroups,
    storageError,
  ] = useLocalStorage(STORAGE_KEY, EMPTY_GROUPS, Array.isArray);
  const shouldLoadStarter = !hasStoredGroups;
  const {
    data: starterGroups,
    loading: fetchLoading,
    error: fetchError,
  } = useFetch("/groups.json", { enabled: shouldLoadStarter });

  useEffect(() => {
    if (shouldLoadStarter && starterGroups) {
      setStoredGroups(starterGroups);
    }
  }, [setStoredGroups, shouldLoadStarter, starterGroups]);

  const groups = hasStoredGroups ? storedGroups : (starterGroups ?? storedGroups);
  const loading = shouldLoadStarter && fetchLoading;
  const error = fetchError || (!starterGroups ? storageError : null);

  const updateGroups = useCallback(
    (operation) => {
      const nextGroups = operation(groups);
      setStoredGroups(nextGroups);
      return nextGroups;
    },
    [groups, setStoredGroups],
  );

  const createGroup = useCallback(
    (details) => {
      const id = globalThis.crypto.randomUUID();
      updateGroups((current) => createGroupInGroups(current, details, id));
      return id;
    },
    [updateGroups],
  );

  const togglePaid = useCallback(
    (groupId, memberId) =>
      updateGroups((current) => toggleMemberPaid(current, groupId, memberId)),
    [updateGroups],
  );

  const addMember = useCallback(
    (groupId, name) =>
      updateGroups((current) => addMemberToGroups(current, groupId, name)),
    [updateGroups],
  );

  const removeMember = useCallback(
    (groupId, memberId) =>
      updateGroups((current) =>
        removeMemberFromGroups(current, groupId, memberId),
      ),
    [updateGroups],
  );

  const recordContribution = useCallback(
    (groupId, details) =>
      updateGroups((current) =>
        recordGroupContribution(current, groupId, details),
      ),
    [updateGroups],
  );

  const value = useMemo(
    () => ({
      groups,
      loading,
      error,
      createGroup,
      togglePaid,
      addMember,
      removeMember,
      recordContribution,
    }),
    [
      groups,
      loading,
      error,
      createGroup,
      togglePaid,
      addMember,
      removeMember,
      recordContribution,
    ],
  );

  return createElement(GroupsContext.Provider, { value }, children);
}
