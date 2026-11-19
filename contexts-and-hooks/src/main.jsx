import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { GroupsProvider } from "./context/GroupsContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GroupsProvider>
      <App />
    </GroupsProvider>
  </StrictMode>,
);
