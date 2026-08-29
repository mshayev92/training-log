import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TrainingLog from "./TrainingLog.jsx";
import UpdatePrompt from "./UpdatePrompt.jsx";
import { requestPersistence } from "./storage.js";
import "./index.css";

requestPersistence();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TrainingLog />
    <UpdatePrompt />
  </StrictMode>
);
