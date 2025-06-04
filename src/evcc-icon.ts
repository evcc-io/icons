export type IconType = "vehicle" | "meter" | "charger";

// Configuration constants
const CONFIG = {
  DEFAULT_ACCENT_COLOR: "#4eb84b",
  DEFAULT_OUTLINE_COLOR: "#000",
  INTERSECTION_ROOT_MARGIN: "50px",
  INTERSECTION_THRESHOLD: 0.1,
} as const;

// Simple cache for loaded icons
const iconCache = new Map<string, string>();

export class EvccIcon extends HTMLElement {
  private _loading = false;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _isInViewport = false;
  private _loadAttempted = false;
  private _loadingPromise: Promise<void> | null = null;

  static get observedAttributes(): string[] {
    return ["type", "name", "accent-color", "outline-color", "size"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._setupIntersectionObserver();
  }

  connectedCallback(): void {
    this.render();
    this._startObserving();
  }

  disconnectedCallback(): void {
    this._stopObserving();
  }

  attributeChangedCallback(): void {
    if (!this._loading) {
      this.render();
    }
  }

  private _setupIntersectionObserver(): void {
    // Only create observer if IntersectionObserver is supported
    if (typeof IntersectionObserver !== "undefined") {
      this._intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.target === this) {
              this._isInViewport = entry.isIntersecting;
              if (this._isInViewport && !this._loadAttempted) {
                this._loadIcon();
              }
            }
          });
        },
        {
          // Load when the icon is 50px away from entering the viewport
          rootMargin: CONFIG.INTERSECTION_ROOT_MARGIN,
          // Trigger when at least 10% of the element is visible
          threshold: CONFIG.INTERSECTION_THRESHOLD,
        },
      );
    }
  }

  private _startObserving(): void {
    if (this._intersectionObserver) {
      this._intersectionObserver.observe(this);
    }
  }

  private _stopObserving(): void {
    if (this._intersectionObserver) {
      this._intersectionObserver.unobserve(this);
    }
  }

  private _getSizeStyles(): string {
    const size = this.getAttribute("size");
    if (size) {
      return `width: ${/^\d+$/.test(size) ? `${size}px` : size};`;
    }
    return "";
  }

  private _getBaseHostStyles(): string {
    return `
      :host {
        display: inline-block;
        aspect-ratio: 1;
        ${this._getSizeStyles()}
      }`;
  }

  private _render(className: string, ariaLabel: string): void {
    this.shadowRoot!.innerHTML = `
      <style>
        ${this._getBaseHostStyles()}
        .${className} {
          width: 100%;
          height: 100%;
          background: white;
          border-radius: 4px;
        }
      </style>
      <div class="${className}"></div>
    `;

    this.setAttribute("aria-label", ariaLabel);
  }

  private async render(): Promise<void> {
    const type = this.getAttribute("type") as IconType;
    const name = this.getAttribute("name");

    if (!type || !name) {
      this._renderError("Both type and name attributes are required");
      return;
    }

    const key = `${type}/${name}`;

    // Check if already loaded from cache
    if (iconCache.has(key)) {
      this._renderIcon();
      return;
    }

    // If IntersectionObserver is not supported, load immediately
    if (typeof IntersectionObserver === "undefined") {
      await this._loadIcon();
      return;
    }

    // For lazy loading, check if in viewport
    if (this._isInViewport && !this._loadAttempted) {
      await this._loadIcon();
    } else {
      this._renderPlaceholder();
    }
  }

  private async _loadIcon(): Promise<void> {
    if (this._loadAttempted || this._loadingPromise) {
      return this._loadingPromise || Promise.resolve();
    }

    this._loadAttempted = true;
    this._loading = true;

    const type = this.getAttribute("type") as IconType;
    const name = this.getAttribute("name")!;
    const key = `${type}/${name}`;

    // Show loading state
    this._renderLoading();

    this._loadingPromise = (async () => {
      try {
        // Import the registry
        const registry = (await import("./svg-registry")).default;

        // Check if icon exists in registry
        const iconLoader = registry[key as keyof typeof registry];
        if (!iconLoader) {
          this._renderError(`Icon not found: ${key}`);
          return;
        }

        // Load the icon module
        const iconModule = await iconLoader();
        const svgString = iconModule.default;

        if (svgString) {
          // Cache the loaded icon
          iconCache.set(key, svgString);
          this._renderIcon();
        } else {
          this._renderError(`Failed to load icon: ${key}`);
        }
      } catch (error) {
        console.error(`Error loading icon ${key}:`, error);
        this._renderError(`Error loading icon: ${key}`);
      } finally {
        this._loading = false;
      }
    })();

    return this._loadingPromise;
  }

  private _renderIcon(): void {
    const type = this.getAttribute("type") as IconType;
    const name = this.getAttribute("name")!;
    const key = `${type}/${name}`;
    const svgContent = iconCache.get(key);

    if (!svgContent) {
      this._renderError(`Icon not loaded: ${key}`);
      return;
    }

    const accentColor = this.getAttribute("accent-color") || CONFIG.DEFAULT_ACCENT_COLOR;
    const outlineColor = this.getAttribute("outline-color") || CONFIG.DEFAULT_OUTLINE_COLOR;

    this.shadowRoot!.innerHTML = `
      <style>
        ${this._getBaseHostStyles()}
        :host {
          --evcc-accent-color: ${accentColor};
          --evcc-outline-color: ${outlineColor};
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
  }

  private _renderPlaceholder(): void {
    this._render("placeholder", "Loading icon");
  }

  private _renderLoading(): void {
    this._render("loading", "Loading icon");
  }

  private _renderError(message: string): void {
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          display: inline-block;
          font-size: 0.8em;
          color: #d32f2f;
        }
      </style>
      <span>${message}</span>
    `;
  }
}

// Define the custom element
customElements.define("evcc-icon", EvccIcon);

export default EvccIcon;
