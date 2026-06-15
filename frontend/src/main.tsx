import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
  const { worker } = await import("./mocks/browser.ts");
  await worker.start();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
