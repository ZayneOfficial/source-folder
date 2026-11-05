import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./AdminAnalyticsPage.css";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("en-ZA") : "-";
}

function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [visitPage, setVisitPage] = useState(1);
  const [loginPage, setLoginPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        const response = await fetch(
          `/api/analytics?visitPage=${visitPage}&loginPage=${loginPage}`,
          {
            credentials: "include",
            signal: controller.signal,
          },
        );
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          navigate("/login", { replace: true });
          return;
        }
        if (!response.ok) throw new Error(data.message || "Could not load analytics.");
        setAnalytics(data);
      } catch (loadError) {
        if (loadError.name !== "AbortError") setError(loadError.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalytics();
    return () => controller.abort();
  }, [navigate, visitPage, loginPage]);

  return (
    <div className="analytics-page">
      <Header role="Admin" />
      <main className="container analytics-content">
        <div className="section-title">
          <div>
            <h1>Website analytics</h1>
            <p className="small">Visitor and sign-in activity from the last 90 days.</p>
          </div>
          <Link className="btn btn-primary" to="/admin/dashboard">Back to dashboard</Link>
        </div>

        {error && <p className="message error" role="alert">{error}</p>}
        {loading && <p className="small" role="status">Loading analytics...</p>}

        {analytics && (
          <>
            <section className="stats analytics-stats" aria-label="Visitor totals">
              <div className="card">
                <div className="stat-label">VISITS TODAY</div>
                <div className="stat-value">{analytics.stats.today}</div>
              </div>
              <div className="card">
                <div className="stat-label">VISITS THIS WEEK</div>
                <div className="stat-value">{analytics.stats.thisWeek}</div>
              </div>
              <div className="card">
                <div className="stat-label">VISITS THIS MONTH</div>
                <div className="stat-value">{analytics.stats.thisMonth}</div>
              </div>
              <div className="card">
                <div className="stat-label">VISITS (90 DAYS)</div>
                <div className="stat-value">{analytics.stats.total}</div>
              </div>
            </section>

            <section className="card analytics-section">
              <h2>Recent login attempts</h2>
              <p className="small">
                Only the admin email or member/helper VN number is recorded. Passwords and names entered at sign-in are never stored.
              </p>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Date and time</th>
                      <th>Account type</th>
                      <th>Login identifier</th>
                      <th>IP address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.loginAttempts.map((attempt) => (
                      <tr key={attempt._id}>
                        <td>{formatDate(attempt.attempted_at)}</td>
                        <td>{attempt.role}</td>
                        <td>{attempt.identifier || "-"}</td>
                        <td>{attempt.ip_address || "-"}</td>
                        <td><span className={`analytics-status analytics-status-${attempt.status}`}>{attempt.status}</span></td>
                      </tr>
                    ))}
                    {!analytics.loginAttempts.length && (
                      <tr><td className="empty" colSpan="5">No login attempts recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="analytics-pagination">
                <span className="small">
                  {analytics.pagination.loginTotal
                    ? `Page ${analytics.pagination.loginPage} of ${analytics.pagination.loginPages} (${analytics.pagination.loginTotal} attempts)`
                    : "No attempts"}
                </span>
                <div className="toolbar">
                  <button
                    className="btn btn-light"
                    type="button"
                    disabled={analytics.pagination.loginPage <= 1}
                    onClick={() => setLoginPage((page) => page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-light"
                    type="button"
                    disabled={analytics.pagination.loginPage >= analytics.pagination.loginPages}
                    onClick={() => setLoginPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>

            <section className="card analytics-section">
              <h2>Recent website visits</h2>
              <div className="analytics-table-wrap">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Date and time</th>
                      <th>Page</th>
                      <th>IP address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.visits.map((visit) => (
                      <tr key={visit._id}>
                        <td>{formatDate(visit.visited_at)}</td>
                        <td>{visit.page}</td>
                        <td>{visit.ip_address || "-"}</td>
                      </tr>
                    ))}
                    {!analytics.visits.length && (
                      <tr><td className="empty" colSpan="3">No website visits recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="analytics-pagination">
                <span className="small">
                  {analytics.pagination.visitTotal
                    ? `Page ${analytics.pagination.visitPage} of ${analytics.pagination.visitPages} (${analytics.pagination.visitTotal} visits)`
                    : "No visits"}
                </span>
                <div className="toolbar">
                  <button
                    className="btn btn-light"
                    type="button"
                    disabled={analytics.pagination.visitPage <= 1}
                    onClick={() => setVisitPage((page) => page - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-light"
                    type="button"
                    disabled={analytics.pagination.visitPage >= analytics.pagination.visitPages}
                    onClick={() => setVisitPage((page) => page + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminAnalyticsPage;
