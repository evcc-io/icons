import type React from "react";
import { type CSSProperties, useEffect, useState } from "react";

export type IconType = "vehicle" | "meter" | "charger";

export interface EvccIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: IconType;
  name: string;
  accentColor?: string;
  outlineColor?: string;
  className?: string;
  style?: CSSProperties;
  size?: string | number;
  width?: string | number;
  height?: string | number;
}

const EvccIcon: React.FC<EvccIconProps> = ({
  type,
  name,
  accentColor = "#4eb84b",
  outlineColor = "#000",
  className = "",
  style = {},
  size,
  width,
  height,
  ...props
}) => {
  const [svgContent, setSvgContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSvg = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Import the SVG registry
        const { svgRegistry } = await import("@evcc/icons");
        const key = `${type}/${name}`;
        const content = svgRegistry[key];

        if (content) {
          setSvgContent(content);
        } else {
          setError(`Icon not found: ${key}`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load icon: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    if (type && name) {
      loadSvg();
    } else {
      setError("Both type and name props are required");
      setLoading(false);
    }
  }, [type, name]);

  if (loading) {
    return <span className={`evcc-icon-loading ${className}`}>Loading...</span>;
  }

  if (error) {
    return <span className={`evcc-icon-error ${className}`}>{error}</span>;
  }

  // Combine styles with CSS custom properties for colors
  const combinedStyle: CSSProperties = {
    "--evcc-accent-color": accentColor,
    "--evcc-outline-color": outlineColor,
    display: "inline-block",
    ...style,
  } as CSSProperties;

  // Handle size prop (sets both width and height)
  if (size) {
    const sizeValue = typeof size === "number" ? `${size}px` : size;
    combinedStyle.width = sizeValue;
    combinedStyle.height = sizeValue;
  }

  // Handle individual width/height props
  if (width) {
    combinedStyle.width = typeof width === "number" ? `${width}px` : width;
  }
  if (height) {
    combinedStyle.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      className={`evcc-icon ${className}`}
      style={combinedStyle}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      aria-label={`${type} ${name}`}
      role="img"
      {...props}
    />
  );
};

export default EvccIcon;
