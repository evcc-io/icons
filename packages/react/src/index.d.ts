import React from "react";

export interface EvccIconProps {
  type: "vehicle" | "meter" | "charger";
  name: string;
  accentColor?: string;
  outlineColor?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: string | number;
  width?: string | number;
  height?: string | number;
}

declare const EvccIcon: React.FC<EvccIconProps>;

export { EvccIcon };
export default EvccIcon;
