import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

const processSvgColors = (svgContent: string): string => {
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

const generateIconModules = async (): Promise<string[]> => {
  const svgFiles = await glob("src/**/*.svg");
  const iconsDir = "dist/icons";
  const iconKeys: string[] = [];

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log(`Generating ${svgFiles.length} individual icon modules...`);

  svgFiles.forEach((filePath) => {
    const content = fs.readFileSync(filePath, "utf8");

    // Remove XML declaration and DOCTYPE
    let cleanSvg = content
      .replace(/^<\?xml[^>]*\?>/, "")
      .replace(/<!DOCTYPE[^>]*>/, "")
      .trim();

    // Process colors to use CSS custom properties
    cleanSvg = processSvgColors(cleanSvg);

    // Extract type and name from path
    const relativePath = path.relative("src", filePath);
    const type = path.dirname(relativePath).replace(/s$/, "");
    const name = path.basename(relativePath, ".svg");
    const key = `${type}/${name}`;
    iconKeys.push(key);

    // Generate the module content
    const moduleContent = `export default ${JSON.stringify(cleanSvg)};
`;

    // Write the module file
    const outputPath = path.join(iconsDir, `${key.replace("/", "-")}.js`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, moduleContent);
    console.log(`Generated: ${outputPath}`);
  });

  return iconKeys.sort();
};

const generateRegistry = (iconKeys: string[]): string => {
  const registryEntries = iconKeys
    .map((key) => {
      const moduleKey = key.replace("/", "-");
      return `  "${key}": () => import("./icons/${moduleKey}.js")`;
    })
    .join(",\n");

  return `// This file is auto-generated. Do not edit manually.
const registry = {
${registryEntries},
};

export default registry;
`;
};

const writeRegistry = async (): Promise<void> => {
  // Ensure src directory exists
  if (!fs.existsSync("src")) {
    fs.mkdirSync("src", { recursive: true });
  }

  // Generate individual icon modules and get their keys
  const iconKeys = await generateIconModules();

  // Generate the registry file
  const registryContent = generateRegistry(iconKeys);
  const registryPath = "src/svg-registry.ts";
  fs.writeFileSync(registryPath, registryContent);
  console.log(`Registry written to: ${registryPath}`);
};

const main = async (): Promise<void> => {
  console.log("Building SVG registry...");
  await writeRegistry();
  console.log("Registry built successfully");
};

main().catch(console.error);
