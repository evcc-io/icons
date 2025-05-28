import { svgRegistry } from "./svg-registry.js";

class EvccIcon extends HTMLElement {
  static get observedAttributes() {
    return [
      "type",
      "name",
      "accent-color",
      "outline-color",
      "size",
      "width",
      "height",
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._loading = false;
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    if (!this._loading) {
      this.render();
    }
  }

  render() {
    const type = this.getAttribute("type");
    const name = this.getAttribute("name");
    const accentColor = this.getAttribute("accent-color") || "#4eb84b";
    const outlineColor = this.getAttribute("outline-color") || "#000";
    const size = this.getAttribute("size");
    const width = this.getAttribute("width");
    const height = this.getAttribute("height");

    if (!type || !name) {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-size: 0.8em;
            color: #d32f2f;
          }
        </style>
        <span>Both type and name attributes are required</span>
      `;
      return;
    }

    const key = `${type}/${name}`;
    const svgContent = svgRegistry[key];

    if (svgContent) {
      // Build size styles
      let sizeStyles = "";
      if (size) {
        sizeStyles = `width: ${size}; height: ${size};`;
      } else {
        if (width) sizeStyles += `width: ${width};`;
        if (height) sizeStyles += `height: ${height};`;
      }

      this.shadowRoot.innerHTML = `
        <style>
          :host {
            --evcc-accent-color: ${accentColor};
            --evcc-outline-color: ${outlineColor};
            display: inline-block;
            ${sizeStyles}
          }
          svg {
            width: 100%;
            height: 100%;
          }
        </style>
        ${svgContent}
      `;

      // Set aria-label for accessibility
      this.setAttribute("aria-label", `${type} ${name}`);
      this.setAttribute("role", "img");
    } else {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-block;
            font-size: 0.8em;
            color: #d32f2f;
          }
        </style>
        <span>Icon not found: ${key}</span>
      `;
    }
  }
}

// Define the custom element
customElements.define("evcc-icon", EvccIcon);

export default EvccIcon;
