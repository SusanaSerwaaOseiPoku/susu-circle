import { useState } from "react";
import { Link } from "react-router-dom";
import { PaginationControls } from "../components/GroupList.jsx";
import { useAuth } from "../hooks/useAuth.js";
import { useGroups } from "../hooks/useGroups.js";
import { getEntityId } from "../state/groupOperations.js";

export default function ExploreGroupsPage() {
  const {
    groups,
    pagination,
    query,
    updateQuery,
    loading,
    error,
    retryLoad,
  } = useGroups();
  const { isAuthenticated, user } = useAuth();
  const [searchInput, setSearchInput] = useState(query.search);

  function handleSearchSubmit(event) {
    event.preventDefault();
    updateQuery({ search: searchInput, page: 1 });
  }

  function handleClearSearch() {
    setSearchInput("");
    updateQuery({ search: "", page: 1 });
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">COMMUNITY SAVINGS</p>
          <h1>All circles</h1>
          <p className="muted">
            {isAuthenticated
              ? `Signed in as ${user.email}. Browse public circles, manage My Groups, or create a new circle.`
              : "Browse public savings circles. Sign in to create a circle, manage members, or record contributions."}
          </p>
        </div>
        {isAuthenticated ? (
          <Link className="button-link button-primary" to="/groups/new">
            + New group
          </Link>
        ) : (
          <Link className="button-link button-secondary" to="/login">
            Log in to get started
          </Link>
        )}
      </div>

      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Explore circles</h2>
            <p className="muted">
              Search by name, sort circles, and navigate pages.
            </p>
          </div>
          <span className="count-pill">{pagination.total}</span>
        </div>

        <form className="filter-bar" onSubmit={handleSearchSubmit}>
          <label className="sr-only" htmlFor="group-search-input">
            Search groups by name
          </label>
          <input
            id="group-search-input"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search groups by name..."
          />
          <label className="sr-only" htmlFor="group-sort-select">
            Sort groups
          </label>
          <select
            id="group-sort-select"
            value={query.sort}
            onChange={(event) =>
              updateQuery({ sort: event.target.value, page: 1 })
            }
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name">Name (A–Z)</option>
            <option value="-name">Name (Z–A)</option>
            <option value="amount">Amount (Low to High)</option>
            <option value="-amount">Amount (High to Low)</option>
          </select>
          <button type="submit">Search</button>
          {query.search && (
            <button
              type="button"
              className="button-secondary"
              onClick={handleClearSearch}
            >
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <p className="notice" role="status">
            Loading savings circles...
          </p>
        ) : error ? (
          <div className="notice error-notice" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="button-secondary"
              onClick={retryLoad}
            >
              Retry loading
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="empty-inline">
            <h3>
              {query.search
                ? `No groups match "${query.search}"`
                : "No savings circles yet"}
            </h3>
            <p className="muted">
              {query.search
                ? "Try another search term or clear your filter."
                : "Create the first circle to start tracking members and contributions."}
            </p>
            {isAuthenticated && !query.search && (
              <Link className="button-link button-primary" to="/groups/new">
                Create a group
              </Link>
            )}
          </div>
        ) : (
          <div className="group-cards-grid">
            {groups.map((group) => {
              const id = getEntityId(group);
              const ownerEmail = group.owner?.email || "Unknown owner";
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
                  <p className="owner-meta">Owner: {ownerEmail}</p>
                  <Link
                    className="button-secondary button-link"
                    to={`/groups/${encodeURIComponent(id)}`}
                  >
                    View group
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        <PaginationControls
          pagination={pagination}
          onPageChange={(nextPage) => updateQuery({ page: nextPage })}
        />
      </section>
    </>
  );
}
