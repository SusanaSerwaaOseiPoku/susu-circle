import { useState } from "react";
import { useGroups } from "../hooks/useGroups.js";
import { getPayoutOrder } from "../state/payoutOrder.js";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function MemberRow({ groupId, memberId }) {
  const { groups, togglePaid, removeMember, saving, ready } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  const member = group?.members.find((entry) => entry.id === memberId);
  const [error, setError] = useState("");
  if (!group || !member) return null;

  async function runAction(action) {
    try {
      await action();
      setError("");
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  return (
    <li className="member-row">
      <div className="member-info">
        <strong>{member.name}</strong>
        <span className={`paid-badge${member.paid ? " paid" : ""}`}>
          {member.paid ? "Paid" : "Not paid"}
        </span>
      </div>
      <div className="member-actions">
        <button
          className="button-secondary"
          type="button"
          disabled={!ready || saving}
          onClick={() =>
            runAction(() => togglePaid(groupId, memberId))
          }
        >
          Mark {member.paid ? "unpaid" : "paid"}
        </button>
        <button
          className="text-button"
          type="button"
          disabled={!ready || saving}
          onClick={() =>
            runAction(() => removeMember(groupId, memberId))
          }
        >
          Remove
        </button>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </li>
  );
}

function AddMemberForm({ groupId }) {
  const { addMember, saving, ready } = useGroups();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await addMember(groupId, name);
      setName("");
      setError("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`member-name-${groupId}`}>
        New member name
      </label>
      <input
        id={`member-name-${groupId}`}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          setError("");
        }}
        placeholder="Add a member"
        minLength={2}
        maxLength={60}
        required
      />
      <button type="submit" disabled={!ready || saving}>
        Add member
      </button>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  );
}

function ContributionForm({ groupId }) {
  const { groups, recordContribution, saving, ready } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [error, setError] = useState("");
  if (!group) return null;

  const eligibleMembers = group.members.filter((member) => !member.paid);
  if (eligibleMembers.length === 0) {
    return (
      <p className="muted">
        {group.members.length === 0
          ? "Add a member before recording a contribution."
          : "Every member has paid this round."}
      </p>
    );
  }

  const selectedMemberId = eligibleMembers.some(
    (member) => member.id === memberId,
  )
    ? memberId
    : eligibleMembers[0].id;

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await recordContribution(groupId, {
        memberId: selectedMemberId,
        amount,
        date,
      });
      setAmount("");
      setDate(todayDateOnly());
      setError("");
    } catch (submitError) {
      setError(submitError.message);
    }
  }

  return (
    <form className="contribution-form" onSubmit={handleSubmit}>
      <label>
        Member
        <select
          value={selectedMemberId}
          onChange={(event) => setMemberId(event.target.value)}
        >
          {eligibleMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Amount
        <input
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </label>
      <label>
        Contribution date
        <input
          type="date"
          value={date}
          max={todayDateOnly()}
          onChange={(event) => setDate(event.target.value)}
          required
        />
      </label>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="submit" disabled={!ready || saving}>
        Record contribution
      </button>
    </form>
  );
}

function GroupMembers({ groupId }) {
  const { groups } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return null;

  return (
    <section className="detail-card">
      <div className="section-heading">
        <h3>Members</h3>
        <span className="count-pill">{group.members.length}</span>
      </div>
      {group.members.length > 0 && (
        <ul className="member-list">
          {group.members.map((member) => (
            <MemberRow
              key={member.id}
              groupId={groupId}
              memberId={member.id}
            />
          ))}
        </ul>
      )}
      <AddMemberForm groupId={groupId} />
    </section>
  );
}

function GroupActivity({ groupId }) {
  const { groups } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return null;

  const contributions = [...group.contributions].reverse();
  return (
    <section className="detail-card">
      <h3>Recent contributions</h3>
      {contributions.length === 0 ? (
        <p className="muted">No contributions recorded yet.</p>
      ) : (
        <ul className="activity-list">
          {contributions.slice(0, 8).map((contribution) => (
            <li key={contribution.id}>
              <span>
                {contribution.memberName || "Member"} · round{" "}
                {contribution.round} · {contribution.date}
              </span>
              <strong>{contribution.amount}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PayoutOrder({ groupId }) {
  const { groups } = useGroups();
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return null;

  const payoutOrder = getPayoutOrder(group.members);

  return (
    <section className="detail-card">
      <h3>Payout order</h3>
      {payoutOrder.length === 0 ? (
        <p className="muted">No members in the payout order yet.</p>
      ) : (
        <ol className="payout-order-list">
          {payoutOrder.map((member) => (
            <li key={member.id}>
              <span className="payout-order-position">
                {member.position}
              </span>
              <div>
                <strong>{member.name}</strong>
                <span className="payout-order-label">
                  {member.position === 1 ? "Next payout" : "Later payout"}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function GroupDetails({ groupId }) {
  const { groups, deleteGroup, ready, saving } = useGroups();
  const [deleteError, setDeleteError] = useState("");
  const group = groups.find((entry) => entry.id === groupId);
  if (!group) return null;

  async function handleDeleteGroup() {
    try {
      await deleteGroup(groupId);
      setDeleteError("");
    } catch (requestError) {
      setDeleteError(requestError.message);
    }
  }

  return (
    <section className="group-detail card">
      <div className="group-heading">
        <div>
          <p className="eyebrow">YOUR SAVINGS CIRCLE</p>
          <h2>{group.name}</h2>
          <p className="muted">
            Round {group.currentRound} · {group.contributionAmount} per member ·{" "}
            {group.frequency} from {group.startDate}
          </p>
        </div>
        <div className="invite-code">
          <span>Current round</span>
          <strong>{group.currentRound}</strong>
          <button
            className="button-danger"
            type="button"
            disabled={!ready || saving}
            onClick={handleDeleteGroup}
          >
            Delete group
          </button>
        </div>
      </div>
      {deleteError && (
        <p className="field-error" role="alert">
          {deleteError}
        </p>
      )}

      <div className="summary-grid">
        <div className="summary-card">
          <span>Members</span>
          <strong>{group.members.length}</strong>
        </div>
        <div className="summary-card">
          <span>Collected</span>
          <strong>
            {group.contributions.reduce(
              (total, contribution) => total + contribution.amount,
              0,
            )}
          </strong>
        </div>
        <div className="summary-card">
          <span>Paid this round</span>
          <strong>
            {group.members.filter((member) => member.paid).length}
          </strong>
        </div>
      </div>

      <div className="detail-grid">
        <GroupMembers groupId={groupId} />
        <section className="detail-card">
          <h3>Record contribution</h3>
          <ContributionForm key={groupId} groupId={groupId} />
        </section>
        <PayoutOrder groupId={groupId} />
        <GroupActivity groupId={groupId} />
      </div>
    </section>
  );
}
