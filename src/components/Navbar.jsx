import { Link, useLocation, useNavigate } from "react-router-dom";

function Navbar({ darkMode, setDarkMode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const loggedIn = Boolean(localStorage.getItem("token"));

  const active = (path) => location.pathname === path;

  function logout() {
    localStorage.removeItem("token");
    navigate("/login");
  }

  return (
    <nav className="site-nav">
      <Link to="/" className="brand">
        <span className="brand-flower">✿</span>
        <span>Prachi</span>
      </Link>

      <div className="nav-links">
        <Link className={active("/") ? "active" : ""} to="/">Home</Link>
        <Link className={active("/projects") ? "active" : ""} to="/projects">Projects</Link>
        <Link className={active("/task-manager") ? "active" : ""} to="/task-manager">Task Manager</Link>
        <Link className={active("/contact") ? "active" : ""} to="/contact">Contact</Link>

        {loggedIn ? (
          <button className="nav-action outline" onClick={logout}>Logout</button>
        ) : (
          <Link className="nav-action" to="/login">Login</Link>
        )}

        <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
          {darkMode ? "☼" : "☾"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
