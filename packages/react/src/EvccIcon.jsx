import React, { useState, useEffect } from "react";

const EvccIcon = ({
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
  const [svgContent, setSvgContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSvg = async () => {
      try {
        setLoading(true);
        setError(null);

        // Import the SVG registry
        const { svgRegistry } = await import("./svg-registry.js");
        const key = `${type}/${name}`;
        const content = svgRegistry[key];

        if (content) {
          setSvgContent(content);
        } else {
          setError(`Icon not found: ${key}`);
        }
      } catch (err) {
        setError(`Failed to load icon: ${err.message}`);
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
  const combinedStyle = {
    "--evcc-accent-color": accentColor,
    "--evcc-outline-color": outlineColor,
    display: "inline-block",
    ...style,
  };

  // Handle size prop (sets both width and height)
  if (size) {
    combinedStyle.width = size;
    combinedStyle.height = size;
  }

  // Handle individual width/height props
  if (width) combinedStyle.width = width;
  if (height) combinedStyle.height = height;

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
