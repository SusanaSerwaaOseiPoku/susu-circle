import { useGroups } from "../hooks/useGroups.js";

function GroupListItem({ groupId, selectedId, onSelect }) {
  const { groups } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return null;

  return (
    <button
      className={`group-option${group.id === selectedId ? " selected" : ""}`}
      type="button"
      aria-pressed={group.id === selectedId}
      onClick={() => onSelect(group.id)}
    >
      <strong>{group.name}</strong>
      <span>
        {group.members.length} members · {group.frequency}
      </span>
    </button>
  );
}

export default function GroupList({ selectedId, onSelect }) {
  const { groups } = useGroups();

  return (
    <section className="card">
      <div className="section-heading">
        <h2>Your circles</h2>
        <span className="count-pill">{groups.length}</span>
      </div>
      {groups.length === 0 ? (
        <p className="muted">No groups yet. Create one to get started.</p>
      ) : (
        <div className="group-list">
          {groups.map((group) => (
            <GroupListItem
              key={group.id}
              groupId={group.id}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
