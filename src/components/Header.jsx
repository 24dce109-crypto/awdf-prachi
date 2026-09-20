import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="hero-card">
      <div className="hero-sparkle sparkle-one">✦</div>
      <div className="hero-sparkle sparkle-two">✿</div>
      <div className="hero-copy">
        <span className="eyebrow">HELLO, I'M PRACHI</span>
        <h1>Creative code,<br /><em>softly designed.</em></h1>
        <p>Computer Engineering student • frontend explorer • curious builder</p>
        <div className="hero-buttons">
          <Link to="/projects" className="hero-btn primary">See my work <span>↗</span></Link>
          <Link to="/contact" className="hero-btn secondary">Let's talk</Link>
        </div>
      </div>
      <div className="hero-orbit">
        <div className="orbit-card">
          <span className="mini-flower">✿</span>
          <strong>design</strong>
          <span>×</span>
          <strong>code</strong>
        </div>
      </div>
    </header>
  );
}

export default Header;
