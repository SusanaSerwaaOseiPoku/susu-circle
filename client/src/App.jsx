import { Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useGroups } from "./hooks/useGroups.js";
import AddContributionPage from "./pages/AddContributionPage.jsx";
import ExploreGroupsPage from "./pages/ExploreGroupsPage.jsx";
import GroupDetailPage from "./pages/GroupDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MyGroupsPage from "./pages/MyGroupsPage.jsx";
import NewGroupPage from "./pages/NewGroupPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import "./App.css";

export default function App() {
  const { saving, saveMessage, saveError } = useGroups();

  return (
    <div className="app-shell">
      <Header />
      <ErrorBoundary>
        <main className="page-content">
          {saving && (
            <p className="notice" role="status">
              {saveMessage}
            </p>
          )}
          {!saving && saveMessage && (
            <p className="notice success-notice" role="status">
              {saveMessage}
            </p>
          )}
          {saveError && (
            <p className="notice error-notice" role="alert">
              {saveError}
            </p>
          )}

          <Routes>
            <Route path="/" element={<ExploreGroupsPage />} />
            <Route path="/login" element={<LoginPage initialMode="login" />} />
            <Route
              path="/register"
              element={<LoginPage initialMode="register" />}
            />
            <Route path="/groups/:id" element={<GroupDetailPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/my-groups" element={<MyGroupsPage />} />
              <Route path="/groups/new" element={<NewGroupPage />} />
              <Route
                path="/groups/:id/contributions/new"
                element={<AddContributionPage />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
      </ErrorBoundary>
      <footer>
        Susu Circle keeps a record of contributions; it does not move money.
      </footer>
    </div>
  );
}
