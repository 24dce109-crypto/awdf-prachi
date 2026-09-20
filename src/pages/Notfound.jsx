import { Link } from "react-router-dom";

function Notfound() {
  return (
    <main className="content-wrap narrow-page">
      <section className="soft-panel not-found">
        <span className="big-flower">✿</span>
        <span className="section-tag">404</span>
        <h1>That page wandered off.</h1>
        <p>The page you are looking for does not exist.</p>
        <Link className="hero-btn primary" to="/">Back home</Link>
      </section>
    </main>
  );
}

export default Notfound;
