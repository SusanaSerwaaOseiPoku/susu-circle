import { useState } from "react";
import { getApiErrorMessage } from "../api.js";
import { useGroups } from "../hooks/useGroups.js";

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function initialValues() {
  return {
    name: "",
    contributionAmount: "",
    frequency: "weekly",
    startDate: todayDateOnly(),
  };
}

export default function CreateGroupForm({ onCreated }) {
  const { createGroup, saving, ready } = useGroups();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");

  function updateValue(event) {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const groupId = await createGroup(values);
      setValues(initialValues());
      setError("");
      onCreated(groupId);
    } catch (submitError) {
      setError(getApiErrorMessage(submitError));
    }
  }

  return (
    <section className="card">
      <h2>Create a group</h2>
      <form className="stacked-form" onSubmit={handleSubmit}>
        <label>
          Group name
          <input
            name="name"
            value={values.name}
            onChange={updateValue}
            minLength={3}
            maxLength={60}
            required
          />
        </label>
        <label>
          Contribution per member
          <input
            name="contributionAmount"
            type="number"
            min="1"
            step="1"
            value={values.contributionAmount}
            onChange={updateValue}
            required
          />
        </label>
        <label>
          Frequency
          <select
            name="frequency"
            value={values.frequency}
            onChange={updateValue}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label>
          Start date
          <input
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={updateValue}
            required
          />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" disabled={!ready || saving}>
          Create group
        </button>
      </form>
    </section>
  );
}
