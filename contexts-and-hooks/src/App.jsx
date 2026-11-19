import { useEffect, useState } from "react";
import CreateGroupForm from "./components/CreateGroupForm.jsx";
import GroupDetails from "./components/GroupDetails.jsx";
import GroupList from "./components/GroupList.jsx";
import Header from "./components/Header.jsx";
import { useGroups } from "./hooks/useGroups.js";
import "./App.css";

export default function App() {
  const { groups, loading, error } = useGroups();
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!groups.some((group) => group.id === selectedId)) {
      setSelectedId(groups[0]?.id ?? null);
    }
  }, [groups, selectedId]);

  return (
    <div className="app-shell">
      <Header />
      <main className="page-content">
        <div className="welcome-row">
          <div>
            <p className="eyebrow">COMMUNITY SAVINGS</p>
            <h1>Your circles</h1>
            <p className="muted">
              Create groups, add members, and record contributions.
            </p>
          </div>
        </div>

        {loading && (
          <p className="notice" role="status">
            Loading starter groups…
          </p>
        )}
        {error && (
          <p className="notice error-notice" role="alert">
            {error}
          </p>
        )}

        <div className="workspace-grid">
          <aside className="sidebar">
            <CreateGroupForm onCreated={setSelectedId} />
            <GroupList selectedId={selectedId} onSelect={setSelectedId} />
          </aside>
          {selectedId ? (
            <GroupDetails key={selectedId} groupId={selectedId} />
          ) : (
            <section className="card empty-state">
              <span className="empty-mark" aria-hidden="true">
                +
              </span>
              <h2>Start with a circle</h2>
              <p className="muted">
                Create a group to begin tracking members and contributions.
              </p>
            </section>
          )}
        </div>
      </main>
      <footer>
        Susu Circle keeps a record of contributions; it does not move money.
      </footer>
    </div>
  );
}
