import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/GroupList.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useGroups } from "../hooks/useGroups.js";
import { getEntityId } from "../state/groupOperations.js";

export default function MyGroupsPage() {
  const { user } = useAuth();
  const {
    myGroups,
    myPagination,
    myQuery,
    updateMyQuery,
    myLoading,
    myError,
    loadMyGroups,
  } = useGroups();

  useEffect(() => {
    loadMyGroups();
  }, [loadMyGroups]);

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">MY GROUPS</p>
          <h1>Your savings circles</h1>
          <p className="muted">
            Circles owned by <strong>{user?.email}</strong>. Only you can edit
            or delete these groups.
          </p>
        </div>
        <Link className="button-link button-primary" to="/groups/new">
          + New group
        </Link>
      </div>

      <section className="card">
        <div className="section-heading">
          <h2>Owned groups</h2>
          <span className="count-pill">{myPagination.total}</span>
        </div>

        <div className="filter-bar">
          <label className="sr-only" htmlFor="my-groups-sort">
            Sort my groups
          </label>
          <select
            id="my-groups-sort"
            value={myQuery.sort}
            onChange={(event) =>
              updateMyQuery({ sort: event.target.value, page: 1 })
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="-name">Name (Z–A)</option>
            <option value="amount">Amount (Low to High)</option>
            <option value="-amount">Amount (High to Low)</option>
          </select>
        </div>

        {myLoading ? (
          <p className="notice" role="status">
            Loading your groups...
          </p>
        ) : myError ? (
          <div className="notice error-notice" role="alert">
            <p>{myError}</p>
            <button
              type="button"
              className="button-secondary"
              onClick={() => loadMyGroups()}
            >
              Retry loading
            </button>
          </div>
        ) : myGroups.length === 0 ? (
          <div className="empty-inline">
            <h3>You haven't created any circles yet</h3>
            <p className="muted">
              Start a new savings group to add members and track contributions.
            </p>
            <Link className="button-link button-primary" to="/groups/new">
              Create your first group
            </Link>
          </div>
        ) : (
          <div className="group-cards-grid">
            {myGroups.map((group) => {
              const id = getEntityId(group);
              const memberCount = Number(group.memberCount ?? 0);
              return (
                <article key={id} className="group-card">
                  <div className="group-card-top">
                    <h3>{group.name}</h3>
                    <span className="count-pill">
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <p className="muted">
                    {group.contributionAmount} per member · {group.frequency} ·
                    Round {group.currentRound}
                  </p>
                  <p className="owner-meta">
                    Owner: {group.owner?.email || user?.email}
                  </p>
                  <Link
                    className="button-secondary button-link"
                    to={`/groups/${encodeURIComponent(id)}`}
                  >
                    Open group
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <PaginationControls
          pagination={myPagination}
          onPageChange={(nextPage) => updateMyQuery({ page: nextPage })}
        />
      </section>
    </>
  );
}
