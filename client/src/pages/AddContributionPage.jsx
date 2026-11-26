import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getApiErrorMessage } from "../api.js";
import { useGroups } from "../hooks/useGroups.js";
import { getEntityId } from "../state/groupOperations.js";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export default function AddContributionPage() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();
  const { loadGroupDetail, recordContribution, saving } = useGroups();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDateOnly());

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await loadGroupDetail(groupId);
      setDetail(data);
      if (data?.group?.contributionAmount) {
        setAmount(String(data.group.contributionAmount));
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Could not load group."));
    } finally {
      setLoading(false);
    }
  }, [groupId, loadGroupDetail]);

  useEffect(() => {
    load();
  }, [load]);

  const members = detail?.members ?? [];
  const selectedMemberId = members.some(
    (member) => getEntityId(member) === memberId,
  )
    ? memberId
    : members[0]
      ? getEntityId(members[0])
      : "";

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");
    try {
      await recordContribution(groupId, {
        memberId: selectedMemberId,
        amount: Number(amount),
        date,
        round: detail?.group?.currentRound ?? 1,
      });
      navigate(`/groups/${encodeURIComponent(groupId)}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  }

  return (
    <section className="narrow-page">
      <div className="back-row">
        <Link
          className="button-secondary button-link"
          to={`/groups/${encodeURIComponent(groupId)}`}
        >
          ← Back to group
        </Link>
      </div>

      <div className="card">
        <p className="eyebrow">ADD CONTRIBUTION</p>
        <h1>
          {detail?.group
            ? `Record contribution for ${detail.group.name}`
            : "Record contribution"}
        </h1>

        {loading ? (
          <p className="notice" role="status">
            Loading group members...
          </p>
        ) : loadError ? (
          <div className="notice error-notice" role="alert">
            <p>{loadError}</p>
            <button type="button" className="button-secondary" onClick={load}>
              Retry loading
            </button>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-inline">
            <p className="muted">
              This group has no members yet. Add a member on the Group Detail
              page before recording a contribution.
            </p>
            <Link
              className="button-primary button-link"
              to={`/groups/${encodeURIComponent(groupId)}`}
            >
              Go to Group Detail
            </Link>
          </div>
        ) : (
          <form className="stacked-form" onSubmit={handleSubmit}>
            <label>
              Member
              <select
                value={selectedMemberId}
                onChange={(event) => setMemberId(event.target.value)}
                required
              >
                {members.map((member) => {
                  const id = getEntityId(member);
                  return (
                    <option key={id} value={id}>
                      {member.name} {member.paid ? "(Already paid)" : "(Unpaid)"}
                    </option>
                  );
                })}
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

            {submitError && (
              <p className="notice error-notice" role="alert">
                {submitError}
              </p>
            )}

            <button type="submit" disabled={saving}>
              {saving ? "Saving contribution..." : "Save contribution"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
