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

const buildPackageRegistry = async (targetPackage: string): Promise<void> => {
  console.log(`Building SVG registry for ${targetPackage} package...`);

  const packageDir = `packages/${targetPackage}`;

  // Ensure src directory exists
  const srcDir = path.join(packageDir, "src");
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Path to SVG files from the package perspective
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

  // Generate the registry file as TypeScript
  const registryContent = `// This file is auto-generated. Do not edit manually.
export interface SvgRegistry {
  [key: string]: string;
}

export type IconType = "vehicle" | "meter" | "charger";

export const svgRegistry: SvgRegistry = ${JSON.stringify(registry, null, 2)};

export const getIcon = (type: IconType, name: string): string | null => {
  const key = \`\${type}/\${name}\`;
  return svgRegistry[key] || null;
};

export const getAllIcons = (): string[] => Object.keys(svgRegistry);

export const getIconsByType = (type: IconType): string[] => {
  return Object.keys(svgRegistry).filter(key => key.startsWith(\`\${type}/\`));
};

export const getAvailableTypes = (): IconType[] => {
  const types = new Set<IconType>();
  Object.keys(svgRegistry).forEach(key => {
    const type = key.split('/')[0] as IconType;
    types.add(type);
  });
  return Array.from(types);
};`;

  // Write the registry file to the target package
  const outputPath = path.join(packageDir, "src", "svg-registry.ts");
  fs.writeFileSync(outputPath, registryContent);

  console.log(`SVG registry built with ${Object.keys(registry).length} icons`);
  console.log(`Registry written to: ${outputPath}`);
};

// Get target package from command line argument
const targetPackage = process.argv[2];

if (!targetPackage) {
  console.error("Usage: tsx scripts/build-package-registry.ts <package-name>");
  console.error("Example: tsx scripts/build-package-registry.ts web");
  process.exit(1);
}

buildPackageRegistry(targetPackage).catch(console.error);
