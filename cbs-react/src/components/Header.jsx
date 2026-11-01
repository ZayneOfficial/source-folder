import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Header({ role }) {
  const [userName, setUserName] = useState("");
  const [accountError, setAccountError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load your account details.");
        }

        setUserName(data.name);
      } catch (error) {
        if (error.name !== "AbortError") {
          setAccountError(error.message);
        }
      }
    }

    loadCurrentUser();
    return () => controller.abort();
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    navigate("/login");
  }

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-identity">
          <div className="header-mark">
            <img src="/cbs.png" alt="Cape Town Burial Society logo" />
          </div>
          <div className="header-copy">
            <div className="header-kicker">Cape Town Burial Society</div>
            <div className="header-title">
              {userName || (accountError ? `${role} account unavailable` : "Loading account...")}
            </div>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-sub" role={accountError ? "alert" : undefined}>
            {accountError || "Management portal"}
          </span>
          <button className="btn btn-light" type="button" onClick={handleLogout}>
            Log out <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;