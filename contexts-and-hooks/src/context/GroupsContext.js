import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../api.js";
import { useFetch } from "../hooks/useFetch.js";
import {
  addMember as addMemberToGroups,
  createGroup as createGroupInGroups,
  recordContribution as recordGroupContribution,
  removeMember as removeMemberFromGroups,
  togglePaid as toggleMemberPaid,
} from "../state/groupOperations.js";

export const GroupsContext = createContext(undefined);

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Request failed.";
}

async function deleteIfPresent(resourcePath) {
  try {
    await api.delete(resourcePath);
  } catch (error) {
    if (error.response?.status !== 404) throw error;
  }
}

function combineGroups(serverData) {
  return serverData.groups.map((group) => ({
    ...group,
    members: serverData.members.filter(
      (member) => member.groupId === group.id,
    ),
    contributions: serverData.contributions
      .filter((contribution) => contribution.groupId === group.id)
      .map((contribution) => ({
        ...contribution,
        memberName:
          contribution.memberName ||
          serverData.members.find(
            (member) => member.id === contribution.memberId,
          )?.name ||
          "Member",
      })),
  }));
}

export function GroupsProvider({ children }) {
  const groupsRequest = useFetch("/groups");
  const membersRequest = useFetch("/members");
  const contributionsRequest = useFetch("/contributions");
  const [serverData, setServerData] = useState(null);
  const [requestStatus, setRequestStatus] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const activeRequest = useRef(null);

  const loading =
    groupsRequest.loading ||
    membersRequest.loading ||
    contributionsRequest.loading;
  const error = [
    groupsRequest.error,
    membersRequest.error,
    contributionsRequest.error,
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    if (loading || error) return;
    if (
      !Array.isArray(groupsRequest.data) ||
      !Array.isArray(membersRequest.data) ||
      !Array.isArray(contributionsRequest.data)
    ) {
      return;
    }

    setServerData({
      groups: groupsRequest.data,
      members: membersRequest.data,
      contributions: contributionsRequest.data,
    });
  }, [
    contributionsRequest.data,
    contributionsRequest.loading,
    contributionsRequest.error,
    error,
    groupsRequest.data,
    groupsRequest.loading,
    groupsRequest.error,
    loading,
    membersRequest.data,
    membersRequest.loading,
    membersRequest.error,
  ]);

  const groups = useMemo(
    () => (serverData ? combineGroups(serverData) : []),
    [serverData],
  );
  const ready = Boolean(serverData && !loading && !error);

  const retryLoad = useCallback(() => {
    groupsRequest.reload();
    membersRequest.reload();
    contributionsRequest.reload();
  }, [
    contributionsRequest.reload,
    groupsRequest.reload,
    membersRequest.reload,
  ]);

  const saveRequest = useCallback(
    (label, operation, successMessage = `${label} saved.`) => {
      if (!ready) {
        return Promise.reject(
          new Error("Wait for the server data to finish loading."),
        );
      }
      if (activeRequest.current) return activeRequest.current;

      const request = Promise.resolve().then(async () => {
        setRequestStatus({
          saving: true,
          message: `Saving ${label}...`,
          error: "",
        });

        try {
          const result = await operation();
          if (result && typeof result === "object" && result.warning) {
            setRequestStatus({
              saving: false,
              message: successMessage,
              error: result.warning,
            });
            return result.value;
          }

          setRequestStatus({
            saving: false,
            message: successMessage,
            error: "",
          });
          return result;
        } catch (requestError) {
          const message = getErrorMessage(requestError);
          setRequestStatus({
            saving: false,
            message: "",
            error: `Could not save ${label.toLowerCase()}: ${message}`,
          });
          throw requestError;
        } finally {
          activeRequest.current = null;
        }
      });

      activeRequest.current = request;
      return request;
    },
    [ready],
  );

  const createGroup = useCallback(
    (details) => {
      const draft = createGroupInGroups(
        [],
        details,
        globalThis.crypto.randomUUID(),
      )[0];
      const groupData = { ...draft };
      delete groupData.members;
      delete groupData.contributions;

      return saveRequest("Group", async () => {
        const savedGroup = (await api.post("/groups", groupData)).data;
        setServerData((current) => ({
          ...current,
          groups: [...current.groups, savedGroup],
        }));
        return savedGroup.id;
      }, "Group created.");
    },
    [saveRequest],
  );

  const addMember = useCallback(
    (groupId, name) => {
      const updatedGroups = addMemberToGroups(
        groups,
        groupId,
        name,
        globalThis.crypto.randomUUID(),
      );
      const group = updatedGroups.find((entry) => entry.id === groupId);
      const member = group.members[group.members.length - 1];

      return saveRequest("Member", async () => {
        const savedMember = (
          await api.post("/members", { ...member, groupId })
        ).data;
        setServerData((current) => ({
          ...current,
          members: [...current.members, savedMember],
        }));
        return savedMember;
      }, "Member added.");
    },
    [groups, saveRequest],
  );

  const togglePaid = useCallback(
    (groupId, memberId) => {
      const updatedGroups = toggleMemberPaid(groups, groupId, memberId);
      const member = updatedGroups
        .find((group) => group.id === groupId)
        .members.find((entry) => entry.id === memberId);

      return saveRequest("Member status", async () => {
        const updatedMember = (
          await api.patch(`/members/${encodeURIComponent(memberId)}`, {
            paid: member.paid,
          })
        ).data;
        setServerData((current) => ({
          ...current,
          members: current.members.map((entry) =>
            entry.id === memberId ? updatedMember : entry,
          ),
        }));
        return updatedMember;
      }, "Member status updated.");
    },
    [groups, saveRequest],
  );

  const removeMember = useCallback(
    (groupId, memberId) => {
      removeMemberFromGroups(groups, groupId, memberId);

      return saveRequest("Member", async () => {
        await api.delete(`/members/${encodeURIComponent(memberId)}`);
        setServerData((current) => ({
          ...current,
          members: current.members.filter(
            (member) => member.id !== memberId,
          ),
        }));
      }, "Member removed.");
    },
    [groups, saveRequest],
  );

  const recordContribution = useCallback(
    (groupId, details) => {
      const updatedGroups = recordGroupContribution(
        groups,
        groupId,
        details,
        globalThis.crypto.randomUUID(),
      );
      const group = updatedGroups.find((entry) => entry.id === groupId);
      const contribution = {
        ...group.contributions[group.contributions.length - 1],
        groupId,
      };

      return saveRequest("Contribution", async () => {
        const savedContribution = (
          await api.post("/contributions", contribution)
        ).data;
        setServerData((current) => ({
          ...current,
          contributions: [...current.contributions, savedContribution],
        }));

        try {
          const updatedMember = (
            await api.patch(
              `/members/${encodeURIComponent(details.memberId)}`,
              { paid: true },
            )
          ).data;
          setServerData((current) => ({
            ...current,
            members: current.members.map((member) =>
              member.id === updatedMember.id ? updatedMember : member,
            ),
          }));
        } catch (requestError) {
          return {
            value: savedContribution,
            warning: `The contribution was saved, but the member status could not be updated: ${getErrorMessage(requestError)}`,
          };
        }

        return savedContribution;
      }, "Contribution recorded.");
    },
    [groups, saveRequest],
  );

  const deleteGroup = useCallback(
    (groupId) =>
      saveRequest("Group", async () => {
        const members = serverData.members.filter(
          (member) => member.groupId === groupId,
        );
        const contributions = serverData.contributions.filter(
          (contribution) => contribution.groupId === groupId,
        );

        for (const member of members) {
          await deleteIfPresent(
            `/members/${encodeURIComponent(member.id)}`,
          );
          setServerData((current) => ({
            ...current,
            members: current.members.filter(
              (entry) => entry.id !== member.id,
            ),
          }));
        }

        for (const contribution of contributions) {
          await deleteIfPresent(
            `/contributions/${encodeURIComponent(contribution.id)}`,
          );
          setServerData((current) => ({
            ...current,
            contributions: current.contributions.filter(
              (entry) => entry.id !== contribution.id,
            ),
          }));
        }

        await deleteIfPresent(`/groups/${encodeURIComponent(groupId)}`);
        setServerData((current) => ({
          ...current,
          groups: current.groups.filter((group) => group.id !== groupId),
        }));
      }, "Group deleted."),
    [saveRequest, serverData],
  );

  const value = useMemo(
    () => ({
      groups,
      loading,
      error,
      ready,
      retryLoad,
      saving: requestStatus.saving,
      saveMessage: requestStatus.message,
      saveError: requestStatus.error,
      createGroup,
      addMember,
      togglePaid,
      removeMember,
      recordContribution,
      deleteGroup,
    }),
    [
      addMember,
      createGroup,
      deleteGroup,
      error,
      groups,
      loading,
      ready,
      recordContribution,
      removeMember,
      requestStatus,
      retryLoad,
      togglePaid,
    ],
  );

  return createElement(GroupsContext.Provider, { value }, children);
}
