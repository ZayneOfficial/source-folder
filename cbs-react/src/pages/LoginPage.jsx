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
      <section className="login-card">
        <div className="brand">
          <div className="brand-icon">
            <img src="/cbs.png" alt="Cape Town Burial Society Logo" />
          </div>
          <div>
            <h1>Burial Society</h1>
            <p>Management System</p>
          </div>
        </div>

        <div className="tabs">
          {[
            ["admin", "Admin Login"],
            ["member", "Member Login"],
            ["helper", "Helper Login"],
          ].map(([role, label]) => (
            <button
              className={`tab ${activeTab === role ? "active" : ""}`}
              key={role}
              type="button"
              onClick={() => setActiveTab(role)}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "admin" && (
          <section className="login-panel">
            <form onSubmit={(event) => handleSubmit(event, "admin")}>
              <label>Email</label>
              <input name="email" type="email" placeholder="Admin email" required />
              <label>Password</label>
              <input name="password" type="password" placeholder="Password" required />
              <button className="btn btn-dark btn-large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login as Admin"}
              </button>
            </form>
          </section>
        )}

        {activeTab === "member" && (
          <section className="login-panel">
            <form onSubmit={(event) => handleSubmit(event, "member")}>
              <label>VN Number</label>
              <input name="vn_number" placeholder="VN001" required />

              <label>Full Name</label>
              <input name="full_name" placeholder="John Smith" autoComplete="name" required />
              <button className="btn btn-primary btn-large" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Login as Member"}
              </button>
            </form>
          </section>
        )}

        {activeTab === "helper" && (
          <section className="login-panel">
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
          </section>
        )}
        {error && <div className="message error" role="alert">{error}</div>}
      </section>
    </main>
  );
}

export default LoginPage;