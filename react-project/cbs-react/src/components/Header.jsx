import { useNavigate } from "react-router-dom";

function Header({ role }) {
  const navigate = useNavigate();

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
          <div className="header-mark" aria-hidden="true">CBS</div>
          <div>
            <div className="header-kicker">Cape Town Burial Society</div>
            <div className="header-title">{role} workspace</div>
          </div>
        </div>
        <div className="header-actions">
          <span className="header-sub">Management portal</span>
          <button className="btn btn-light" type="button" onClick={handleLogout}>
            Log out <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;