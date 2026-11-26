import { Link, useNavigate } from "react-router-dom";
import CreateGroupForm from "../components/CreateGroupForm.jsx";

export default function NewGroupPage() {
  const navigate = useNavigate();

  return (
    <section className="narrow-page">
      <div className="back-row">
        <Link className="button-secondary button-link" to="/my-groups">
          ← Back to My Groups
        </Link>
      </div>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">NEW CIRCLE</p>
          <h1>Create a savings group</h1>
          <p className="muted">
            You will be saved as the group owner, with permission to edit or
            delete the circle.
          </p>
        </div>
      </div>
      <CreateGroupForm
        onCreated={(groupId) =>
          navigate(`/groups/${encodeURIComponent(groupId)}`)
        }
      />
    </section>
  );
}
