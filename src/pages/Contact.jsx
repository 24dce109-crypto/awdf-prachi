import { useState } from "react";

function Contact() {
  const [message, setMessage] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main className="content-wrap narrow-page">
      <section className="soft-panel contact-panel">
        <span className="section-tag">SAY HELLO</span>
        <h1>Let's make something nice.</h1>
        <p className="contact-intro">This little form demonstrates controlled React state and live UI updates.</p>

        <label htmlFor="message">Your message</label>
        <textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your message..." rows="7" />
        <div className="message-meta"><span>{message.length} characters</span><span>state: connected</span></div>

        <div className="contact-actions">
          <button className="hero-btn primary" onClick={() => setShowHelp(!showHelp)}>
            {showHelp ? "Hide help" : "Need help?"}
          </button>
        </div>

        {showHelp && <p className="help-box">You can write a message about a project, collaboration or just say hello.</p>}
        <p className="live-message">Preview: {message || "Your message will appear here as you type."}</p>
      </section>
    </main>
  );
}

export default Contact;
