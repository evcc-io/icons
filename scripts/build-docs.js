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

const buildDocs = () => {
  console.log("Building GitHub Pages documentation...");

  // Ensure docs directory exists
  if (!fs.existsSync("docs")) {
    fs.mkdirSync("docs", { recursive: true });
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

  // Read the template HTML file
  const templatePath = "docs/index.html";
  let htmlContent = fs.readFileSync(templatePath, "utf8");

  // Replace the empty iconRegistry with the actual data
  const registryScript = `const iconRegistry = ${JSON.stringify(
    registry,
    null,
    2
  )};`;

  // Find and replace the iconRegistry declaration
  htmlContent = htmlContent.replace(
    /const iconRegistry = \{\};/,
    registryScript
  );

  // Write the updated HTML file
  fs.writeFileSync(templatePath, htmlContent);

  console.log(
    `GitHub Pages documentation built with ${
      Object.keys(registry).length
    } icons`
  );
  console.log("Available icons:", Object.keys(registry));
  console.log("Documentation available at: docs/index.html");
};

buildDocs();
