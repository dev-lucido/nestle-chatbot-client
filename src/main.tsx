// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Mamabot from "./pages/Mamabot/Mamabot.tsx";
import Namegenerator from "./pages/Namegenerator/Namegenerator.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="nestle-chatbot-client">
      <Routes>
        <Route path="/mamabot" element={<Mamabot />} />
        <Route path="/namegenerator" element={<Namegenerator />} />
        {/* <Route path="*" element={<Navigate to="/mamabot" replace />} /> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
