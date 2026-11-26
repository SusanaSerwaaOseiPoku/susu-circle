import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api.js";
import { useAuth } from "../hooks/useAuth.js";
import { useGroups } from "../hooks/useGroups.js";
import { getEntityId } from "../state/groupOperations.js";

export default function GroupDetailPage() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const {
    loadGroupDetail,
    updateGroup,
    deleteGroup,
    addMember,
    togglePaid,
    removeMember,
    saving,
  } = useGroups();
  const { user, isAuthenticated } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editFrequency, setEditFrequency] = useState("weekly");
  const [memberName, setMemberName] = useState("");

  const refreshDetail = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const next = await loadGroupDetail(groupId);
      setDetail(next);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Could not load group details."));
    } finally {
      setLoading(false);
    }
  }, [groupId, loadGroupDetail]);

  useEffect(() => {
    refreshDetail();
  }, [refreshDetail]);

  if (loading && !detail) {
    return (
      <section className="card">
        <div className="back-row">
          <Link className="button-secondary button-link" to="/">
            ← Back to circles
          </Link>
        </div>
        <p className="notice" role="status">
          Loading group, members, and contributions...
        </p>
      </section>
    );
  }

  if (loadError && !detail) {
    return (
      <section className="card">
        <div className="back-row">
          <Link className="button-secondary button-link" to="/">
            ← Back to circles
          </Link>
        </div>
        <div className="notice error-notice" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            className="button-secondary"
            onClick={refreshDetail}
          >
            Retry loading
          </button>
        </div>
      </section>
    );
  }

  if (!detail?.group) {
    return (
      <section className="card empty-state">
        <h2>Group not found</h2>
        <p className="muted">This savings circle may have been deleted.</p>
        <Link className="button-primary button-link" to="/">
          Back to All Circles
        </Link>
      </section>
    );
  }

  const { group, members, contributions, totalSaved } = detail;
  const ownerId =
    group.owner && typeof group.owner === "object"
      ? getEntityId(group.owner)
      : String(group.owner ?? "");
  const ownerEmail =
    group.owner && typeof group.owner === "object"
      ? group.owner.email
      : "Unknown owner";
  const currentUserId = getEntityId(user);
  const isOwner = Boolean(
    isAuthenticated && currentUserId && ownerId === currentUserId,
  );

  function openEditForm() {
    setEditName(group.name);
    setEditAmount(String(group.contributionAmount));
    setEditFrequency(group.frequency);
    setActionError("");
    setEditing(true);
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    try {
      await updateGroup(groupId, {
        name: editName,
        contributionAmount: Number(editAmount),
        frequency: editFrequency,
      });
      setEditing(false);
      setActionError("");
      await refreshDetail();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleDeleteGroup() {
    try {
      await deleteGroup(groupId);
      setActionError("");
      navigate("/my-groups", { replace: true });
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleAddMember(event) {
    event.preventDefault();
    try {
      await addMember(groupId, memberName);
      setMemberName("");
      setActionError("");
      await refreshDetail();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleTogglePaid(member) {
    try {
      await togglePaid(groupId, getEntityId(member), !member.paid);
      setActionError("");
      await refreshDetail();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  async function handleRemoveMember(member) {
    try {
      await removeMember(groupId, getEntityId(member));
      setActionError("");
      await refreshDetail();
    } catch (error) {
      setActionError(getApiErrorMessage(error));
    }
  }

  return (
    <section className="group-detail card">
      <div className="back-row">
        <Link className="button-secondary button-link" to="/">
          ← All circles
        </Link>
        {isAuthenticated && (
          <Link
            className="button-primary button-link"
            to={`/groups/${encodeURIComponent(groupId)}/contributions/new`}
          >
            + Add contribution
          </Link>
        )}
      </div>

      <div className="group-heading">
        <div>
          <div className="owner-row">
            <p className="eyebrow">GROUP DETAIL</p>
            <span className={`owner-badge${isOwner ? " owned" : ""}`}>
              {isOwner ? "You own this group" : `Owner: ${ownerEmail}`}
            </span>
          </div>
          <h2>{group.name}</h2>
          <p className="muted">
            Round {group.currentRound} · {group.contributionAmount} per member ·{" "}
            {group.frequency} from {group.startDate}
          </p>
        </div>

        <div className="invite-code">
          <span>Current round</span>
          <strong>{group.currentRound}</strong>
          {isOwner ? (
            <div className="group-owner-actions">
              <button
                className="button-secondary"
                type="button"
                disabled={saving}
                onClick={editing ? () => setEditing(false) : openEditForm}
              >
                {editing ? "Cancel edit" : "Edit group"}
              </button>
              <button
                className="button-danger"
                type="button"
                disabled={saving}
                onClick={handleDeleteGroup}
              >
                Delete group
              </button>
            </div>
          ) : (
            <span className="muted">Owner-only edit/delete</span>
          )}
        </div>
      </div>

      {editing && isOwner && (
        <form className="edit-group-form" onSubmit={handleSaveEdit}>
          <label>
            Group name
            <input
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              minLength={2}
              maxLength={60}
              required
            />
          </label>
          <label>
            Contribution amount
            <input
              type="number"
              min="1"
              step="1"
              value={editAmount}
              onChange={(event) => setEditAmount(event.target.value)}
              required
            />
          </label>
          <label>
            Frequency
            <select
              value={editFrequency}
              onChange={(event) => setEditFrequency(event.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
          <button type="submit" disabled={saving}>
            Save changes
          </button>
        </form>
      )}

      {actionError && (
        <p className="notice error-notice" role="alert">
          {actionError}
        </p>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span>Members</span>
          <strong>{members.length}</strong>
        </div>
        <div className="summary-card">
          <span>Total saved (server)</span>
          <strong>{new Intl.NumberFormat().format(totalSaved)}</strong>
        </div>
        <div className="summary-card">
          <span>Paid this round</span>
          <strong>{members.filter((member) => member.paid).length}</strong>
        </div>
      </div>

      <div className="detail-grid">
        <section className="detail-card">
          <div className="section-heading">
            <h3>Members</h3>
            <span className="count-pill">{members.length}</span>
          </div>
          {members.length === 0 ? (
            <p className="muted">
              No members yet. {isAuthenticated ? "Add the first member below." : "Sign in to add members."}
            </p>
          ) : (
            <ul className="member-list">
              {members.map((member) => {
                const memberId = getEntityId(member);
                return (
                  <li key={memberId} className="member-row">
                    <div className="member-info">
                      <strong>{member.name}</strong>
                      <span
                        className={`paid-badge${member.paid ? " paid" : ""}`}
                      >
                        {member.paid ? "Paid" : "Not paid"}
                      </span>
                    </div>
                    {isAuthenticated && (
                      <div className="member-actions">
                        <button
                          className="button-secondary"
                          type="button"
                          disabled={saving}
                          onClick={() => handleTogglePaid(member)}
                        >
                          Mark {member.paid ? "unpaid" : "paid"}
                        </button>
                        <button
                          className="text-button"
                          type="button"
                          disabled={saving}
                          onClick={() => handleRemoveMember(member)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isAuthenticated && (
            <form className="inline-form" onSubmit={handleAddMember}>
              <label className="sr-only" htmlFor={`member-name-${groupId}`}>
                New member name
              </label>
              <input
                id={`member-name-${groupId}`}
                value={memberName}
                onChange={(event) => setMemberName(event.target.value)}
                placeholder="Add a member"
                minLength={2}
                maxLength={60}
                required
              />
              <button type="submit" disabled={saving}>
                Add member
              </button>
            </form>
          )}
        </section>

        <section className="detail-card">
          <div className="section-heading">
            <h3>Contributions</h3>
            <span className="count-pill">
              Total saved: {new Intl.NumberFormat().format(totalSaved)}
            </span>
          </div>
          {contributions.length === 0 ? (
            <div className="empty-inline">
              <p className="muted">No contributions recorded yet.</p>
              {isAuthenticated && (
                <Link
                  className="button-secondary button-link"
                  to={`/groups/${encodeURIComponent(groupId)}/contributions/new`}
                >
                  Record first contribution
                </Link>
              )}
            </div>
          ) : (
            <ul className="activity-list">
              {contributions.map((contribution) => {
                const payerName =
                  contribution.member?.name || "Former member";
                return (
                  <li key={getEntityId(contribution)}>
                    <span>
                      <strong>{payerName}</strong> · round {contribution.round}{" "}
                      · {contribution.date}
                    </span>
                    <strong>{contribution.amount}</strong>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
