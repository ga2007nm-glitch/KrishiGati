import React from "react";
import { createRoot } from "react-dom/client";
import KrishiGatiDashboard from "./dashboard";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <KrishiGatiDashboard />
  </React.StrictMode>
);
