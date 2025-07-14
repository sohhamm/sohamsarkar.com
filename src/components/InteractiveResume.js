export default class InteractiveResume {
  constructor(container) {
    this.container = container;
    this.currentSection = 'overview';
    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    this.animateIn();
  }

  render() {
    this.container.innerHTML = `
      <div class="resume-wrapper">
        <div class="resume-header">
          <div class="avatar">
            <img src="/assets/pfp.png" alt="Soham Sarkar" />
          </div>
          <div class="header-content">
            <h1 class="name">Soham Sarkar</h1>
            <p class="title">Full Stack Developer</p>
            <div class="contact-links">
              <a href="mailto:sohamsarkar.work@gmail.com" class="contact-link">
                <span class="icon">📧</span>
                <span>Email</span>
              </a>
              <a href="https://github.com/sohhamm" class="contact-link" target="_blank">
                <span class="icon">🐙</span>
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/sohhamm" class="contact-link" target="_blank">
                <span class="icon">💼</span>
                <span>LinkedIn</span>
              </a>
              <a href="https://twitter.com/sohhamm_" class="contact-link" target="_blank">
                <span class="icon">🐦</span>
                <span>Twitter</span>
              </a>
            </div>
          </div>
        </div>

        <div class="resume-nav">
          <button class="nav-btn active" data-section="overview">Overview</button>
          <button class="nav-btn" data-section="skills">Skills</button>
          <button class="nav-btn" data-section="projects">Projects</button>
          <button class="nav-btn" data-section="download">Download</button>
        </div>

        <div class="resume-content">
          <div class="section active" data-section="overview">
            <h2>About Me</h2>
            <div class="overview-grid">
              <div class="overview-card">
                <h3>🚀 Passion</h3>
                <p>Building intuitive web experiences with modern technologies</p>
              </div>
              <div class="overview-card">
                <h3>💡 Focus</h3>
                <p>Full-stack development with React, TypeScript, and Node.js</p>
              </div>
              <div class="overview-card">
                <h3>🎯 Goal</h3>
                <p>Creating scalable applications that solve real-world problems</p>
              </div>
            </div>
          </div>

          <div class="section" data-section="skills">
            <h2>Technical Skills</h2>
            <div class="skills-grid">
              <div class="skill-category">
                <h3>Frontend</h3>
                <div class="skill-tags">
                  <span class="skill-tag">React</span>
                  <span class="skill-tag">Next.js</span>
                  <span class="skill-tag">TypeScript</span>
                  <span class="skill-tag">Tailwind CSS</span>
                </div>
              </div>
              <div class="skill-category">
                <h3>Backend</h3>
                <div class="skill-tags">
                  <span class="skill-tag">Node.js</span>
                  <span class="skill-tag">Express</span>
                  <span class="skill-tag">PostgreSQL</span>
                  <span class="skill-tag">MongoDB</span>
                </div>
              </div>
              <div class="skill-category">
                <h3>Tools & Others</h3>
                <div class="skill-tags">
                  <span class="skill-tag">Git</span>
                  <span class="skill-tag">Docker</span>
                  <span class="skill-tag">Vercel</span>
                  <span class="skill-tag">Netlify</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section" data-section="projects">
            <h2>Featured Projects</h2>
            <div class="projects-grid">
              <div class="project-card">
                <h3>Product Feedback App</h3>
                <p>Full-stack application with React, TypeScript, Node.js, and PostgreSQL</p>
                <div class="project-links">
                  <a href="https://product-feedback-application.vercel.app/" target="_blank" class="project-link">
                    <span>🌐 Live Demo</span>
                  </a>
                  <a href="https://github.com/sohhamm/product-feedback-client" target="_blank" class="project-link">
                    <span>📱 Frontend</span>
                  </a>
                  <a href="https://github.com/sohhamm/product-feedback-server" target="_blank" class="project-link">
                    <span>🔧 Backend</span>
                  </a>
                </div>
              </div>
              <div class="project-card">
                <h3>Password Generator</h3>
                <p>Secure password generator built with React</p>
                <div class="project-links">
                  <a href="https://passwordxgenerator.vercel.app/" target="_blank" class="project-link">
                    <span>🌐 Live Demo</span>
                  </a>
                  <a href="https://github.com/sohhamm/password-generator" target="_blank" class="project-link">
                    <span>📱 Code</span>
                  </a>
                </div>
              </div>
              <div class="project-card">
                <h3>Country Finder</h3>
                <p>Interactive country explorer with React</p>
                <div class="project-links">
                  <a href="https://awesome-country-finder.netlify.app/" target="_blank" class="project-link">
                    <span>🌐 Live Demo</span>
                  </a>
                  <a href="https://github.com/sohhamm/country-finder" target="_blank" class="project-link">
                    <span>📱 Code</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="section" data-section="download">
            <h2>Download Resume</h2>
            <div class="download-section">
              <p>Get a PDF copy of my resume</p>
              <a href="https://assets.sohamsarkar.com/resume.pdf" target="_blank" class="download-btn">
                <span class="icon">📄</span>
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    this.addStyles();
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .resume-wrapper {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        color: white;
        font-family: 'Victor Mono', monospace;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.6s ease;
      }

      .resume-wrapper.animate-in {
        opacity: 1;
        transform: translateY(0);
      }

      .resume-header {
        display: flex;
        align-items: center;
        gap: 2rem;
        margin-bottom: 3rem;
        padding: 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .avatar {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid var(--blue-400);
        transition: transform 0.3s ease;
      }

      .avatar:hover {
        transform: scale(1.05);
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .header-content {
        flex: 1;
      }

      .name {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        background: linear-gradient(45deg, var(--blue-400), var(--indigo-300));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .title {
        font-size: 1.2rem;
        color: var(--blue-300);
        margin-bottom: 1.5rem;
      }

      .contact-links {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .contact-link {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 25px;
        text-decoration: none;
        color: white;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .contact-link:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: var(--blue-400);
        transform: translateY(-2px);
      }

      .resume-nav {
        display: flex;
        gap: 1rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        overflow-x: auto;
      }

      .nav-btn {
        padding: 0.75rem 1.5rem;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 25px;
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
      }

      .nav-btn:hover {
        background: rgba(59, 130, 246, 0.2);
        border-color: var(--blue-400);
      }

      .nav-btn.active {
        background: var(--blue-400);
        border-color: var(--blue-400);
      }

      .resume-content {
        position: relative;
      }

      .section {
        display: none;
        animation: fadeIn 0.5s ease;
      }

      .section.active {
        display: block;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .section h2 {
        font-size: 2rem;
        margin-bottom: 2rem;
        color: var(--blue-300);
      }

      .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 2rem;
      }

      .overview-card {
        padding: 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: transform 0.3s ease;
      }

      .overview-card:hover {
        transform: translateY(-5px);
      }

      .overview-card h3 {
        font-size: 1.2rem;
        margin-bottom: 1rem;
        color: var(--blue-300);
      }

      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
      }

      .skill-category {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .skill-category h3 {
        margin-bottom: 1rem;
        color: var(--blue-300);
      }

      .skill-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .skill-tag {
        padding: 0.5rem 1rem;
        background: var(--blue-400);
        color: white;
        border-radius: 20px;
        font-size: 0.9rem;
        transition: transform 0.2s ease;
      }

      .skill-tag:hover {
        transform: scale(1.05);
      }

      .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
      }

      .project-card {
        padding: 2rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
        border-radius: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: transform 0.3s ease;
      }

      .project-card:hover {
        transform: translateY(-5px);
      }

      .project-card h3 {
        margin-bottom: 1rem;
        color: var(--blue-300);
      }

      .project-card p {
        margin-bottom: 1.5rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .project-links {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .project-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        text-decoration: none;
        color: white;
        transition: all 0.3s ease;
        border: 1px solid transparent;
      }

      .project-link:hover {
        background: var(--blue-400);
        border-color: var(--blue-400);
        transform: translateY(-2px);
      }

      .download-section {
        text-align: center;
        padding: 3rem;
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .download-section p {
        font-size: 1.2rem;
        margin-bottom: 2rem;
        color: rgba(255, 255, 255, 0.8);
      }

      .download-btn {
        display: inline-flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 2rem;
        background: var(--blue-400);
        color: white;
        text-decoration: none;
        border-radius: 30px;
        font-size: 1.1rem;
        font-weight: 500;
        transition: all 0.3s ease;
        border: 2px solid var(--blue-400);
      }

      .download-btn:hover {
        background: transparent;
        color: var(--blue-400);
        transform: translateY(-3px);
      }

      @media (max-width: 768px) {
        .resume-wrapper {
          padding: 1rem;
        }
        
        .resume-header {
          flex-direction: column;
          text-align: center;
        }
        
        .avatar {
          width: 100px;
          height: 100px;
        }
        
        .name {
          font-size: 2rem;
        }
        
        .overview-grid,
        .skills-grid,
        .projects-grid {
          grid-template-columns: 1fr;
        }
        
        .contact-links {
          justify-content: center;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  bindEvents() {
    const navBtns = this.container.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const section = e.target.dataset.section;
        this.switchSection(section);
      });
    });

    // Add hover effects for skill tags
    const skillTags = this.container.querySelectorAll('.skill-tag');
    skillTags.forEach(tag => {
      tag.addEventListener('mouseenter', () => {
        tag.style.background = 'var(--indigo-300)';
      });
      tag.addEventListener('mouseleave', () => {
        tag.style.background = 'var(--blue-400)';
      });
    });
  }

  switchSection(sectionName) {
    // Update active nav button
    const navBtns = this.container.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
      btn.classList.remove('active');
    });
    this.container.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update active section
    const sections = this.container.querySelectorAll('.section');
    sections.forEach(section => {
      section.classList.remove('active');
    });
    this.container.querySelector(`.section[data-section="${sectionName}"]`).classList.add('active');

    this.currentSection = sectionName;
  }

  animateIn() {
    setTimeout(() => {
      this.container.querySelector('.resume-wrapper').classList.add('animate-in');
    }, 100);
  }
}