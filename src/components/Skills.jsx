function Skills({ skillList }) {
  return (
    <section className="soft-panel skills-panel">
      <div className="section-heading-row">
        <div>
          <span className="section-tag">TOOLBOX</span>
          <h2>Things I enjoy working with.</h2>
        </div>
        <span className="tiny-note">learning • making • improving</span>
      </div>
      <ul className="skill-pills">
        {skillList.map((skill, index) => (
          <li key={skill} style={{ "--i": index }}>{skill}</li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;
