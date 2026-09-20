import Header from "../components/Header";
import About from "../components/About";
import Skills from "../components/Skills";
import Footer from "../components/Footer";

function Home() {
  const skills = ["React", "JavaScript", "C++", "HTML & CSS", "MySQL", "UI/UX"];

  return (
    <>
      <Header />

      <main className="content-wrap">
        <About />
        <Skills skillList={skills} />

        <section className="soft-panel services-panel">
          <div className="section-heading-row">
            <div>
              <span className="section-tag">WHAT I DO</span>
              <h2>From a rough idea to something you can use.</h2>
            </div>
            <span className="hand-note">currently building ↗</span>
          </div>

          <div className="service-grid">
            <article><span>01</span><h3>Web Development</h3><p>Responsive interfaces and practical React applications with a focus on clarity.</p></article>
            <article><span>02</span><h3>UI / UX</h3><p>Friendly layouts, simple navigation and visual details that make products feel thoughtful.</p></article>
            <article><span>03</span><h3>Problem Solving</h3><p>Breaking a problem into smaller pieces and building a solution that can grow later.</p></article>
          </div>
        </section>

        <section className="soft-panel approach-panel">
          <span className="section-tag">MY APPROACH</span>
          <h2>Small steps. Clear thinking. Better results.</h2>
          <div className="approach-list">
            <div><b>01</b><span>Understand</span><p>Start with the actual problem.</p></div>
            <div><b>02</b><span>Sketch</span><p>Plan the interface and flow.</p></div>
            <div><b>03</b><span>Build</span><p>Turn the plan into working code.</p></div>
            <div><b>04</b><span>Improve</span><p>Test, learn and refine.</p></div>
          </div>
        </section>

        <section className="soft-panel explore-panel">
          <div>
            <span className="section-tag">CURRENTLY EXPLORING</span>
            <h2>Learning something new, one project at a time.</h2>
          </div>
          <div className="explore-tags">
            <span>Full Stack</span><span>Cybersecurity</span><span>Backend</span><span>Cloud</span>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Home;
