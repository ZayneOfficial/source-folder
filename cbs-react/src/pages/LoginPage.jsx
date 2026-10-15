import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [activeTab, setActiveTab] = useState("admin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event, role) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      if (data.role === "member") {
        localStorage.setItem("member_vn", data.member.vn_number);
      }
      navigate(`/${role}/dashboard`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <aside className="login-aside">
          <div className="login-brand">
            <div className="login-mark" aria-hidden="true">CBS</div>
            <div>
              <span>Cape Town</span>
              <strong>Burial Society</strong>
            </div>
          </div>

          <div className="login-message">
            <p className="eyebrow">COMMUNITY CARE PORTAL</p>
            <h1>Care, organized<br />around community.</h1>
            <p>One place for member records, contributions, and the people who support them.</p>
          </div>

          <div className="login-aside-footer">
            <span className="status-dot" />
            <span>MEMBERS · HELPERS · ADMINISTRATION</span>
          </div>
        </aside>

        <section className="login-card">
          <div className="login-heading">
            <p className="eyebrow">MANAGEMENT PORTAL</p>
            <h2>Sign in</h2>
            <p>Choose your workspace to continue.</p>
          </div>

          <div className="tabs" role="tablist" aria-label="Choose a workspace">
            {[
              ["admin", "Admin"],
              ["member", "Member"],
              ["helper", "Helper"],
            ].map(([role, label]) => (
              <button
                className={`tab ${activeTab === role ? "active" : ""}`}
                key={role}
                type="button"
                role="tab"
                aria-selected={activeTab === role}
                onClick={() => setActiveTab(role)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "admin" && <section className="login-panel">
            <form onSubmit={(event) => handleSubmit(event, "admin")}>
              <label>Email</label>
              <input name="email" type="email" placeholder="Admin email" required />
              <label>Password</label>
              <input name="password" type="password" placeholder="Password" required />
              <button className="btn btn-dark btn-large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login as Admin"}
              </button>
            </form>
          </section>}

          {activeTab === "member" && <section className="login-panel">
            <form onSubmit={(event) => handleSubmit(event, "member")}>
              <label>VN Number</label>
              <input name="vn_number" placeholder="VN001" required />

              <label>Full Name</label>
              <input name="full_name" placeholder="John Smith" autoComplete="name" required />
              <button className="btn btn-primary btn-large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login as Member"}
              </button>
            </form>
          </section>}

          {activeTab === "helper" && <section className="login-panel">
            <form onSubmit={(event) => handleSubmit(event, "helper")}>
              <label>VN Number</label>
              <input name="vn_number" placeholder="VN001" required />

              <label>Full Name</label>
              <input name="full_name" placeholder="John Smith" required />

              <label>Helper Password</label>
              <input name="helper_password" type="password" required />

              <button className="btn btn-primary btn-large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login as Helper"}
              </button>
            </form>
          </section>}

          {error && <div className="message error" role="alert">{error}</div>}
        </section>
      </div>
    </main>
  );
}

export default LoginPage;