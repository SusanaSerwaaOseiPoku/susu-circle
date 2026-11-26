import { useState } from "react";
import { useGroups } from "../hooks/useGroups.js";
import { getEntityId } from "../state/groupOperations.js";

export function PaginationControls({ pagination, onPageChange }) {
  const { page, totalPages, total, hasPrev, hasNext } = pagination;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination-bar" aria-label="Group pages">
      <span className="muted pagination-summary">
        Page {page} of {totalPages} · {total} {total === 1 ? "group" : "groups"}
      </span>
      <div className="pagination-buttons">
        <button
          type="button"
          className="button-secondary"
          disabled={!hasPrev}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            className={pageNumber === page ? "page-button active" : "button-secondary page-button"}
            aria-current={pageNumber === page ? "page" : undefined}
            onClick={() => onPageChange(pageNumber)}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          className="button-secondary"
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default function GroupList({ onSelect }) {
  const { groups, pagination, query, updateQuery, loading } = useGroups();
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
    <section className="card">
      <div className="section-heading">
        <div>
          <h2>Explore circles</h2>
          <p className="muted">
            Search by name, sort circles, and browse pages.
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

      {!loading && groups.length === 0 ? (
        <p className="muted">
          {query.search
            ? `No groups match "${query.search}".`
            : "No groups yet. Sign in and create one to get started."}
        </p>
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
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => onSelect(id)}
                >
                  View group
                </button>
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
  );
}
