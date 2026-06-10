// Reusable UI as Lit web components. Lit is imported straight from a CDN as an
// ES module — no build step. Loaded via <script type="module" src="...">.
//
// All components render into the LIGHT DOM (createRenderRoot returns `this`) so
// the global css/style.css applies unchanged. Light DOM has no <slot>, so
// content is passed via attributes (JSON for arrays).

import { LitElement, html } from "https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js";

// Base class: render into light DOM instead of a shadow root.
class LightElement extends LitElement {
  createRenderRoot() {
    return this;
  }
}

// Parse a JSON-array attribute, tolerating empty/invalid values.
function jsonList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

class SiteHeader extends LightElement {
  render() {
    return html`
      <header class="site-header">
        <div class="container">
          <a class="logo" href="/">internus<span class="tld">.dev</span></a>
          <nav class="site-nav">
            <a href="/#services">Services</a>
            <a href="/#projects">Projects</a>
            <a href="/#about">About</a>
            <a href="/#contact">Contact</a>
          </nav>
        </div>
      </header>
    `;
  }
}
customElements.define("site-header", SiteHeader);

class SiteFooter extends LightElement {
  static properties = {
    reg: { type: String },
    year: { type: String },
  };

  constructor() {
    super();
    this.reg = "[PLACEHOLDER]";
    this.year = "2026";
  }

  render() {
    return html`
      <footer class="site-footer">
        <div class="container">
          <span>© ${this.year} Internus LTD · Reg. no. ${this.reg}</span>
          <span><a href="/privacy.html">Privacy</a></span>
        </div>
      </footer>
    `;
  }
}
customElements.define("site-footer", SiteFooter);

class ServiceCard extends LightElement {
  static properties = {
    icon: { type: String },
    heading: { type: String },
    body: { type: String },
    items: { type: String }, // JSON array
  };

  render() {
    return html`
      <div class="card">
        <div class="icon">${this.icon}</div>
        <h3>${this.heading}</h3>
        <p>${this.body}</p>
        <ul>
          ${jsonList(this.items).map((item) => html`<li>${item}</li>`)}
        </ul>
      </div>
    `;
  }
}
customElements.define("service-card", ServiceCard);

class ProjectCard extends LightElement {
  static properties = {
    title: { type: String },
    client: { type: String },
    href: { type: String },
    problem: { type: String },
    built: { type: String },
    outcome: { type: String },
    tags: { type: String }, // JSON array
  };

  render() {
    return html`
      <article class="project">
        <div class="meta">
          <strong>${this.title}</strong>
          ${this.client}
          <div class="tags">
            ${jsonList(this.tags).map((tag) => html`<span class="tag">${tag}</span>`)}
          </div>
        </div>
        <div class="body">
          <p><strong>Problem:</strong> ${this.problem}</p>
          <p><strong>What we built:</strong> ${this.built}</p>
          <p><strong>Outcome:</strong> ${this.outcome}</p>
          <p><a href="${this.href}">Read the full case study →</a></p>
        </div>
      </article>
    `;
  }
}
customElements.define("project-card", ProjectCard);
