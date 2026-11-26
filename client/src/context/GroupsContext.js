import {
  createContext,
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api, getApiErrorMessage } from "../api.js";
import { getEntityId } from "../state/groupOperations.js";

export const GroupsContext = createContext(undefined);

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 4,
  total: 0,
  totalPages: 1,
  hasPrev: false,
  hasNext: false,
};

function normalizePaginatedPayload(data, fallbackLimit = 4) {
  if (Array.isArray(data)) {
    return {
      groups: data,
      pagination: {
        page: 1,
        limit: fallbackLimit,
        total: data.length,
        totalPages: 1,
        hasPrev: false,
        hasNext: false,
      },
    };
  }
  return {
    groups: Array.isArray(data?.groups) ? data.groups : [],
    pagination: data?.pagination || { ...DEFAULT_PAGINATION, limit: fallbackLimit },
  };
}

export function GroupsProvider({ children }) {
  const [query, setQuery] = useState({
    search: "",
    sort: "newest",
    page: 1,
    limit: 4,
  });
  const [groups, setGroups] = useState([]);
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const [myQuery, setMyQuery] = useState({
    search: "",
    sort: "newest",
    page: 1,
    limit: 4,
  });
  const [myGroups, setMyGroups] = useState([]);
  const [myPagination, setMyPagination] = useState(DEFAULT_PAGINATION);
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState("");

  const [requestStatus, setRequestStatus] = useState({
    saving: false,
    message: "",
    error: "",
  });
  const activeRequest = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function load() {
      try {
        const response = await api.get("/groups", {
          params: {
            search: query.search || undefined,
            sort: query.sort,
            page: query.page,
            limit: query.limit,
          },
          signal: controller.signal,
        });
        const normalized = normalizePaginatedPayload(response.data, query.limit);
        setGroups(normalized.groups);
        setPagination(normalized.pagination);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(`Could not load groups: ${getApiErrorMessage(loadError)}`);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [query.limit, query.page, query.search, query.sort, reloadCount]);

  const loadMyGroups = useCallback(async (override = {}) => {
    const params = {
      search: override.search !== undefined ? override.search : myQuery.search,
      sort: override.sort !== undefined ? override.sort : myQuery.sort,
      page: override.page !== undefined ? override.page : myQuery.page,
      limit: override.limit !== undefined ? override.limit : myQuery.limit,
    };

    setMyLoading(true);
    setMyError("");
    try {
      const response = await api.get("/groups/mine", {
        params: {
          search: params.search || undefined,
          sort: params.sort,
          page: params.page,
          limit: params.limit,
        },
      });
      const normalized = normalizePaginatedPayload(response.data, params.limit);
      setMyGroups(normalized.groups);
      setMyPagination(normalized.pagination);
      return normalized;
    } catch (loadError) {
      const message = getApiErrorMessage(loadError, "Could not load your groups.");
      setMyError(message);
      setMyGroups([]);
      return null;
    } finally {
      setMyLoading(false);
    }
  }, [myQuery.limit, myQuery.page, myQuery.search, myQuery.sort]);

  const loadGroupDetail = useCallback(async (groupId) => {
    const encoded = encodeURIComponent(groupId);
    const [membersResponse, contributionsResponse] = await Promise.all([
      api.get(`/groups/${encoded}/members`),
      api.get(`/groups/${encoded}/contributions`),
    ]);

    return {
      group: contributionsResponse.data.group,
      members: Array.isArray(membersResponse.data) ? membersResponse.data : [],
      contributions: Array.isArray(contributionsResponse.data.contributions)
        ? contributionsResponse.data.contributions
        : [],
      totalSaved: Number(contributionsResponse.data.totalSaved || 0),
    };
  }, []);

  const retryLoad = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  const updateQuery = useCallback((patch) => {
    setQuery((current) => ({
      ...current,
      ...patch,
      page: patch.page !== undefined ? patch.page : 1,
    }));
  }, []);

  const updateMyQuery = useCallback((patch) => {
    setMyQuery((current) => ({
      ...current,
      ...patch,
      page: patch.page !== undefined ? patch.page : 1,
    }));
  }, []);

  const saveRequest = useCallback(
    (label, operation, successMessage = `${label} saved.`) => {
      if (activeRequest.current) return activeRequest.current;

      const request = Promise.resolve().then(async () => {
        setRequestStatus({
          saving: true,
          message: `Saving ${label}...`,
          error: "",
        });

        try {
          const result = await operation();
          setRequestStatus({
            saving: false,
            message: successMessage,
            error: "",
          });
          return result;
        } catch (requestError) {
          const message = getApiErrorMessage(requestError);
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
    [],
  );

  const createGroup = useCallback(
    (details) => {
      const payload = {
        name: typeof details.name === "string" ? details.name.trim() : "",
        contributionAmount: Number(details.contributionAmount),
        frequency: details.frequency || "weekly",
        startDate: details.startDate,
        currentRound: 1,
      };

      return saveRequest(
        "Group",
        async () => {
          const savedGroup = (await api.post("/groups", payload)).data;
          setReloadCount((count) => count + 1);
          return getEntityId(savedGroup);
        },
        "Group created.",
      );
    },
    [saveRequest],
  );

  const updateGroup = useCallback(
    (groupId, details) =>
      saveRequest(
        "Group",
        async () => {
          const updatedGroup = (
            await api.patch(`/groups/${encodeURIComponent(groupId)}`, details)
          ).data;
          setReloadCount((count) => count + 1);
          return updatedGroup;
        },
        "Group updated.",
      ),
    [saveRequest],
  );

  const deleteGroup = useCallback(
    (groupId) =>
      saveRequest(
        "Group",
        async () => {
          await api.delete(`/groups/${encodeURIComponent(groupId)}`);
          setReloadCount((count) => count + 1);
        },
        "Group deleted.",
      ),
    [saveRequest],
  );

  const addMember = useCallback(
    (groupId, name) =>
      saveRequest(
        "Member",
        async () => {
          const savedMember = (
            await api.post("/members", {
              group: groupId,
              name: typeof name === "string" ? name.trim() : "",
              paid: false,
            })
          ).data;
          setReloadCount((count) => count + 1);
          return savedMember;
        },
        "Member added.",
      ),
    [saveRequest],
  );

  const togglePaid = useCallback(
    (_groupId, memberId, nextPaid) =>
      saveRequest(
        "Member status",
        async () => {
          const updatedMember = (
            await api.patch(`/members/${encodeURIComponent(memberId)}`, {
              paid: Boolean(nextPaid),
            })
          ).data;
          return updatedMember;
        },
        "Member status updated.",
      ),
    [saveRequest],
  );

  const removeMember = useCallback(
    (_groupId, memberId) =>
      saveRequest(
        "Member",
        async () => {
          await api.delete(`/members/${encodeURIComponent(memberId)}`);
          setReloadCount((count) => count + 1);
        },
        "Member removed.",
      ),
    [saveRequest],
  );

  const recordContribution = useCallback(
    (groupId, details) =>
      saveRequest(
        "Contribution",
        async () => {
          const savedContribution = (
            await api.post("/contributions", {
              group: groupId,
              member: details.memberId,
              amount: Number(details.amount),
              date: details.date,
              round: details.round,
            })
          ).data;
          return savedContribution;
        },
        "Contribution recorded.",
      ),
    [saveRequest],
  );

  const value = useMemo(
    () => ({
      groups,
      pagination,
      query,
      updateQuery,
      loading,
      error,
      ready: !loading,
      retryLoad,
      myGroups,
      myPagination,
      myQuery,
      updateMyQuery,
      myLoading,
      myError,
      loadMyGroups,
      loadGroupDetail,
      saving: requestStatus.saving,
      saveMessage: requestStatus.message,
      saveError: requestStatus.error,
      createGroup,
      updateGroup,
      deleteGroup,
      addMember,
      togglePaid,
      removeMember,
      recordContribution,
    }),
    [
      addMember,
      createGroup,
      deleteGroup,
      error,
      groups,
      loadGroupDetail,
      loadMyGroups,
      loading,
      myError,
      myGroups,
      myLoading,
      myPagination,
      myQuery,
      pagination,
      query,
      recordContribution,
      removeMember,
      requestStatus,
      retryLoad,
      togglePaid,
      updateGroup,
      updateMyQuery,
      updateQuery,
    ],
  );

  return createElement(GroupsContext.Provider, { value }, children);
}
