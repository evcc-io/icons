export type IconType = "vehicle" | "meter" | "charger";

export { default as registry } from "./svg-registry.js";

if (typeof HTMLElement !== "undefined" && typeof customElements !== "undefined") {
  import("./evcc-icon.js").then(({ EvccIcon }) => {
    customElements.define("evcc-icon", EvccIcon);
  });
}
