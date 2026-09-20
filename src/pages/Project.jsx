import { useEffect, useState } from "react";

function Project() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const fetchRepos = () => {
    setLoading(true);
    setError(null);
    fetch("https://api.github.com/users/24dce109-crypto/repos")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch repositories");
        return response.json();
      })
      .then(setRepos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRepos(); }, []);

  const filteredRepos = repos.filter((repo) => repo.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <main className="content-wrap narrow-page"><section className="soft-panel state-panel"><span className="section-tag">PROJECTS</span><h1>Finding my little collection...</h1><p>Loading projects from GitHub.</p></section></main>;
  if (error) return <main className="content-wrap narrow-page"><section className="soft-panel state-panel"><span className="section-tag">PROJECTS</span><h1>Oops, the shelf is sleepy.</h1><p>{error}</p><button className="hero-btn primary" onClick={fetchRepos}>Try again</button></section></main>;

  return (
    <main className="content-wrap">
      <section className="projects-header soft-panel">
        <div><span className="section-tag">MY PROJECTS</span><h1>A few things I've been building.</h1><p>These cards are loaded from the GitHub API, so the page always reflects the public repositories.</p></div>
        <span className="project-count">{filteredRepos.length} repos</span>
      </section>

      <section className="soft-panel project-browser">
        <input className="search-box" type="text" placeholder="Search repositories..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="project-list">
          {filteredRepos.map((repo, index) => (
            <article className="repo-card" key={repo.id}>
              <div className="repo-top"><span>0{index + 1}</span><span>★ {repo.stargazers_count}</span></div>
              <h2>{repo.name}</h2>
              <p>{repo.description || "A small experiment from my development journey."}</p>
              <a href={repo.html_url} target="_blank" rel="noopener noreferrer">View repository ↗</a>
            </article>
          ))}
        </div>
        {filteredRepos.length === 0 && <p className="empty-state">No repositories found.</p>}
      </section>
    </main>
  );
}

export default Project;
