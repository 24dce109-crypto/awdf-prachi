import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTask, deleteTask, getTasks, suggestTask, updateTask } from "../services/api";

function TaskManager() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem("token")));
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState("");
  const [suggestion, setSuggestion] = useState("");

  async function loadTasks() {
    setLoading(true); setError("");
    try { setTasks(await getTasks()); }
    catch (err) { setError(err.message); if (err.status === 401) { localStorage.removeItem("token"); setLoggedIn(false); } }
    finally { setLoading(false); }
  }

  useEffect(() => { if (loggedIn) loadTasks(); }, [loggedIn]);

  async function addTask(e) {
    e.preventDefault(); setError("");
    try {
      const task = await createTask({ title, description, priority });
      setTasks((old) => [task, ...old]); setTitle(""); setDescription(""); setPriority("medium");
    } catch (err) { setError(err.message); }
  }

  async function generateSuggestion() {
    setSuggestionError("");
    setSuggestion("");
    setSuggestionLoading(true);
    try {
      const result = await suggestTask(title);
      setDescription(result.description);
      setPriority(result.priority);
      setSuggestion(`${result.description} Suggested priority: ${result.priority}. ${result.disclaimer}`);
    } catch (err) {
      setSuggestionError(err.message);
    } finally {
      setSuggestionLoading(false);
    }
  }

  async function toggleTask(task) {
    try {
      const updated = await updateTask(task._id, { completed: !task.completed });
      setTasks((old) => old.map((item) => item._id === updated._id ? updated : item));
    } catch (err) { setError(err.message); }
  }

  async function removeTask(id) {
    if (!window.confirm("Delete this task?")) return;
    try { await deleteTask(id); setTasks((old) => old.filter((task) => task._id !== id)); }
    catch (err) { setError(err.message); }
  }

  if (!loggedIn) {
    return (
      <main className="content-wrap narrow-page">
        <section className="soft-panel auth-gate">
          <span className="big-flower">✿</span>
          <span className="section-tag">TASK MANAGER</span>
          <h1>Your little productivity corner.</h1>
          <p>Login first to access the MongoDB-backed task manager.</p>
          <div className="gate-buttons"><Link className="hero-btn primary" to="/login">Login →</Link><Link className="hero-btn secondary" to="/login?mode=register">Create account</Link></div>
        </section>
      </main>
    );
  }

  return (
    <main className="content-wrap">
      <section className="task-head soft-panel">
        <div><span className="section-tag">PRACTICAL 5 • 6 • 7</span><h1>My Task Garden.</h1><p>MongoDB persistence + React CRUD + JWT protected routes.</p></div>
        <button className="hero-btn secondary" onClick={() => { localStorage.removeItem("token"); setLoggedIn(false); navigate("/login"); }}>Logout</button>
      </section>

      <section className="soft-panel task-workspace">
        <form className="task-form" onSubmit={addTask}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" required />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short note" />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select>
          <button className="hero-btn primary" type="submit">Add task +</button>
        </form>

        <section className="ai-suggestion" aria-label="AI task suggestion">
          <button
            className="hero-btn secondary"
            type="button"
            onClick={generateSuggestion}
            disabled={!title.trim() || suggestionLoading}
          >
            {suggestionLoading ? "Generating suggestion..." : "Suggest description + priority"}
          </button>
          <p className="ai-disclaimer">Only the task title is sent to OpenAI; do not include personal or confidential information.</p>
          <p className="ai-disclaimer">AI-generated suggestion; review before use.</p>
          {suggestion && <p className="ai-result" role="status">{suggestion}</p>}
          {suggestionError && <p className="error-text" role="alert">{suggestionError}</p>}
        </section>

        {loading && <p className="loading-text">Fetching your tasks...</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="task-list">
          {tasks.map((task) => (
            <article className={`task-card ${task.completed ? "completed" : ""}`} key={task._id}>
              <div className="task-check" onClick={() => toggleTask(task)}>{task.completed ? "✓" : "○"}</div>
              <div className="task-info"><span className={`priority ${task.priority}`}>{task.priority}</span><h2>{task.title}</h2><p>{task.description || "No note added."}</p></div>
              <button className="delete-task" onClick={() => removeTask(task._id)}>Delete</button>
            </article>
          ))}
          {!loading && tasks.length === 0 && <div className="empty-tasks"><span>✿</span><p>No tasks yet. Add your first one above.</p></div>}
        </div>
      </section>
    </main>
  );
}

export default TaskManager;
