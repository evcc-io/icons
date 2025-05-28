const fs = require("fs");
const path = require("path");
const glob = require("glob");

const processSvgColors = (svgContent) => {
  return (
    svgContent
      // Replace the green accent color
      .replace(/fill:#4eb84b/g, "fill:var(--evcc-accent-color, #4eb84b)")
      // Replace black outline/stroke colors
      .replace(/stroke:#000/g, "stroke:var(--evcc-outline-color, #000)")
      .replace(/fill:#000/g, "fill:var(--evcc-outline-color, #000)")
      // Handle any other black colors that might be fills
      .replace(/fill:black/g, "fill:var(--evcc-outline-color, #000)")
      .replace(/stroke:black/g, "stroke:var(--evcc-outline-color, #000)")
      // Also handle hex variations of black
      .replace(/fill:#000000/g, "fill:var(--evcc-outline-color, #000)")
      .replace(/stroke:#000000/g, "stroke:var(--evcc-outline-color, #000)")
  );
};

const buildSvgRegistry = () => {
  console.log("Building SVG registry...");

  // Ensure dist directory exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  const svgFiles = glob.sync("src/**/*.svg");
  const registry = {};

  console.log(`Found ${svgFiles.length} SVG files`);

  svgFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");

    // Remove XML declaration and DOCTYPE
    let cleanSvg = content
      .replace(/^<\?xml[^>]*\?>/, "")
      .replace(/<!DOCTYPE[^>]*>/, "")
      .trim();

    // Process colors to use CSS custom properties
    cleanSvg = processSvgColors(cleanSvg);

    // Extract type and name from path: src/vehicles/kia-niro-ev.svg -> vehicle/kia-niro-ev
    const relativePath = path.relative("src", filePath);
    const type = path.dirname(relativePath).replace(/s$/, ""); // remove 's' from vehicles -> vehicle
    const name = path.basename(relativePath, ".svg");
    const key = `${type}/${name}`;

    registry[key] = cleanSvg;
    console.log(`Processed: ${key}`);
  });

  // Generate the registry file
  const registryContent = `export const svgRegistry = ${JSON.stringify(
    registry,
    null,
    2
  )};

export const getIcon = (type, name) => {
  const key = \`\${type}/\${name}\`;
  return svgRegistry[key] || null;
};

export const getAllIcons = () => Object.keys(svgRegistry);

export const getIconsByType = (type) => {
  return Object.keys(svgRegistry).filter(key => key.startsWith(\`\${type}/\`));
};`;

  // Write the core registry
  fs.writeFileSync("dist/svg-registry.js", registryContent);

  console.log(`SVG registry built with ${Object.keys(registry).length} icons`);
  console.log("Available icons:", Object.keys(registry));
};

buildSvgRegistry();
