import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import HelperDashboard from "./pages/HelperDashboard";
import MemberDashboard from "./pages/MemberDashboard";
import ContributionReportPage from "./pages/ContributionReportPage";

function NotFound() {
  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Page not found</h1>
        <p className="hint">The page you are looking for does not exist.</p>
        <a className="btn btn-dark btn-large" href="/login">Return to login</a>
      </section>
    </main>
  );
}

function App() {
  useEffect(() => {
    const loadingScreen = document.getElementById("loadingScreen");
    if (!loadingScreen) return undefined;

    const hideTimer = window.setTimeout(() => {
      loadingScreen.classList.add("launch-screen-hidden");
      window.setTimeout(() => loadingScreen.remove(), 450);
    }, 5000);

    return () => window.clearTimeout(hideTimer);
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<LoginPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/helper/dashboard"
          element={<HelperDashboard />}
        />

        <Route path="/member/dashboard" element={<MemberDashboard />} />

        <Route path="/reports/contributions" element={<ContributionReportPage />} />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;