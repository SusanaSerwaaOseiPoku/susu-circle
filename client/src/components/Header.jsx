import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useGroups } from "../hooks/useGroups.js";

export default function Header() {
  const { pagination } = useGroups();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Susu Circle home">
        <span className="brand-mark" aria-hidden="true">
          SC
        </span>
        <span>Susu Circle</span>
      </Link>

      <nav className="header-nav" aria-label="Primary navigation">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-link-button${isActive ? " active" : ""}`
          }
        >
          All Circles ({pagination.total})
        </NavLink>
        <NavLink
          to="/my-groups"
          className={({ isActive }) =>
            `nav-link-button${isActive ? " active" : ""}`
          }
        >
          My Groups
        </NavLink>
        <NavLink
          to="/groups/new"
          className={({ isActive }) =>
            `nav-link-button${isActive ? " active" : ""}`
          }
        >
          New Group
        </NavLink>
      </nav>

      <div className="header-controls">
        {isAuthenticated ? (
          <div className="account-controls">
            <span className="user-pill" title={user.email}>
              {user.email}
            </span>
            <button
              type="button"
              className="header-action-button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="account-controls">
            <Link className="header-action-button nav-button-link" to="/login">
              Log in
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
