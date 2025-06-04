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
  private _currentKey: string | null = null;
  private _type: IconType | null = null;
  private _name: string | null = null;

  static get observedAttributes(): string[] {
    return ["type", "name", "accent-color", "outline-color", "size"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._setupIntersectionObserver();
  }

  connectedCallback(): void {
    this._updateAttributes();
    this.render();
    this._startObserving();
  }

  disconnectedCallback(): void {
    this._stopObserving();
  }

  attributeChangedCallback(): void {
    this._updateAttributes();

    if (!this._loading) {
      this.render();
    }
  }

  private _updateAttributes(): void {
    const type = this.getAttribute("type") as IconType;
    const name = this.getAttribute("name");
    const newKey = type && name ? `${type}/${name}` : null;

    // Reset loading state if the icon key has changed
    if (newKey !== this._currentKey) {
      this._currentKey = newKey;
      this._loadAttempted = false;
      this._loadingPromise = null;
    }

    this._type = type;
    this._name = name;
  }

  private get _currentIconKey(): string | null {
    return this._type && this._name ? `${this._type}/${this._name}` : null;
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
    if (!this._type || !this._name) {
      this._renderError("Both type and name attributes are required");
      return;
    }

    const key = this._currentIconKey!;

    // Check if already loaded from cache
    if (iconCache.has(key)) {
      this._renderIcon(key);
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

    const key = this._currentIconKey!;

    // Show loading state
    this._renderLoading();

    this._loadingPromise = (async () => {
      try {
        // Import the registry
        const registry = (await import("./svg-registry.js")).default;

        // Try to find the specific icon first
        let iconLoader = registry[key as keyof typeof registry];
        let attemptedKey = key;

        if (!iconLoader) {
          const genericKey = `${this._type}/generic`;
          iconLoader = registry[genericKey as keyof typeof registry];
          attemptedKey = genericKey;
        }

        if (!iconLoader) {
          this._renderError(`Icon not found: ${key} (and no generic fallback available)`);
          return;
        }

        const iconModule = await iconLoader();
        const svgString = iconModule.default;

        if (svgString) {
          // Cache the icon content under the requested key
          iconCache.set(key, svgString);

          this._renderIcon(key);
        } else {
          this._renderError(`Failed to load icon: ${attemptedKey}`);
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

  private _renderIcon(key: string): void {
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
    this.setAttribute("aria-label", `${this._type} ${this._name}`);
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
