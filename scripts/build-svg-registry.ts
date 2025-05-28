import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

interface SvgRegistry {
  [key: string]: string;
}

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

const buildSvgRegistry = async (): Promise<void> => {
  console.log("Building SVG registry...");

  // Ensure dist directory exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  const svgFiles = await glob("src/**/*.svg");
  const registry: SvgRegistry = {};

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

  // Generate the registry file as JavaScript
  const registryContent = `export const svgRegistry = ${JSON.stringify(registry, null, 2)};

export const getIcon = (type, name) => {
  const key = \`\${type}/\${name}\`;
  return svgRegistry[key] || null;
};

export const getAllIcons = () => Object.keys(svgRegistry);

export const getIconsByType = (type) => {
  return Object.keys(svgRegistry).filter(key => key.startsWith(\`\${type}/\`));
};

export const getAvailableTypes = () => {
  const types = new Set();
  Object.keys(svgRegistry).forEach(key => {
    const type = key.split('/')[0];
    types.add(type);
  });
  return Array.from(types);
};`;

  // Write the core registry as JavaScript
  fs.writeFileSync("dist/svg-registry.js", registryContent);

  // Generate TypeScript declaration file
  const declarationContent = `export interface SvgRegistry {
  [key: string]: string;
}

export type IconType = 'vehicle' | 'meter' | 'charger';

export declare const svgRegistry: SvgRegistry;
export declare const getIcon: (type: IconType, name: string) => string | null;
export declare const getAllIcons: () => string[];
export declare const getIconsByType: (type: IconType) => string[];
export declare const getAvailableTypes: () => IconType[];`;

  fs.writeFileSync("dist/svg-registry.d.ts", declarationContent);

  console.log(`SVG registry built with ${Object.keys(registry).length} icons`);
  console.log("Available icons:", Object.keys(registry));
};

buildSvgRegistry().catch(console.error);
