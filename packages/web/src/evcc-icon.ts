import { svgRegistry } from "@evcc/icons";

export type IconType = "vehicle" | "meter" | "charger";

export class EvccIcon extends HTMLElement {
	private _loading = false;

	static get observedAttributes(): string[] {
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
	}

	connectedCallback(): void {
		this.render();
	}

	attributeChangedCallback(): void {
		if (!this._loading) {
			this.render();
		}
	}

	private render(): void {
		const type = this.getAttribute("type") as IconType;
		const name = this.getAttribute("name");
		const accentColor = this.getAttribute("accent-color") || "#4eb84b";
		const outlineColor = this.getAttribute("outline-color") || "#000";
		const size = this.getAttribute("size");
		const width = this.getAttribute("width");
		const height = this.getAttribute("height");

		if (!type || !name) {
			this.shadowRoot!.innerHTML = `
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
				const sizeValue =
					size.includes("px") || size.includes("%") || size.includes("em")
						? size
						: `${size}px`;
				sizeStyles = `width: ${sizeValue}; height: ${sizeValue};`;
			} else {
				if (width) {
					const widthValue =
						width.includes("px") || width.includes("%") || width.includes("em")
							? width
							: `${width}px`;
					sizeStyles += `width: ${widthValue};`;
				}
				if (height) {
					const heightValue =
						height.includes("px") ||
						height.includes("%") ||
						height.includes("em")
							? height
							: `${height}px`;
					sizeStyles += `height: ${heightValue};`;
				}
			}

			this.shadowRoot!.innerHTML = `
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
			this.shadowRoot!.innerHTML = `
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
