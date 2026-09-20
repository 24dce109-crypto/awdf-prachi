import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../services/api";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(new URLSearchParams(location.search).get("mode") === "register" ? "register" : "login");
  }, [location.search]);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "register") {
        await registerUser({ email, password });
        setMode("login");
        setPassword("");
        setMessage("Account created. You can log in now.");
      } else {
        const data = await loginUser({ email, password });
        localStorage.setItem("token", data.token);
        navigate("/task-manager", { replace: true });
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="content-wrap narrow-page">
      <section className="soft-panel auth-panel">
        <span className="big-flower">✿</span>
        <span className="section-tag">PRACTICAL 7</span>
        <h1>{mode === "login" ? "Welcome back." : "Create your account."}</h1>
        <p>JWT authentication protects the Task Manager while keeping this page simple enough to understand in a viva.</p>

        <form onSubmit={submit} className="auth-form">
          <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" minLength="6" required /></label>
          <button className="hero-btn primary" type="submit" disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login →" : "Register →"}</button>
        </form>

        {message && <p className="status-message">{message}</p>}
        <button className="switch-auth" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {mode === "login" ? "New here? Create an account" : "Already registered? Login"}
        </button>
      </section>
    </main>
  );
}

export default Login;
