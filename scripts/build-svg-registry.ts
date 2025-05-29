import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

interface SvgRegistry {
  [key: string]: string;
}

interface BuildConfig {
  mode: "global" | "package";
  packageName?: string;
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

const buildSvgRegistry = async (): Promise<SvgRegistry> => {
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

  return registry;
};

const generateRegistryCode = (registry: SvgRegistry, isTypeScript: boolean, includeComment = false): string => {
  const comment = includeComment ? "// This file is auto-generated. Do not edit manually.\n" : "";

  const interfaceDeclaration = isTypeScript
    ? `export interface SvgRegistry {
  [key: string]: string;
}

export type IconType = "vehicle" | "meter" | "charger";

`
    : "";

  const registryDeclaration = isTypeScript
    ? `export const svgRegistry: SvgRegistry = ${JSON.stringify(registry, null, 2)};`
    : `export const svgRegistry = ${JSON.stringify(registry, null, 2)};`;

  const typeAnnotations = isTypeScript
    ? {
        getIcon: "(type: IconType, name: string): string | null",
        getAllIcons: "(): string[]",
        getIconsByType: "(type: IconType): string[]",
        getAvailableTypes: "(): IconType[]",
        typeAssertion: " as IconType",
      }
    : {
        getIcon: "(type, name)",
        getAllIcons: "()",
        getIconsByType: "(type)",
        getAvailableTypes: "()",
        typeAssertion: "",
      };

  const setType = isTypeScript ? "Set<IconType>" : "Set";

  return `${comment}${interfaceDeclaration}${registryDeclaration}

export const getIcon = ${typeAnnotations.getIcon} => {
  const key = \`\${type}/\${name}\`;
  return svgRegistry[key] || null;
};

export const getAllIcons = ${typeAnnotations.getAllIcons} => Object.keys(svgRegistry);

export const getIconsByType = ${typeAnnotations.getIconsByType} => {
  return Object.keys(svgRegistry).filter(key => key.startsWith(\`\${type}/\`));
};

export const getAvailableTypes = ${typeAnnotations.getAvailableTypes} => {
  const types = new ${setType}();
  Object.keys(svgRegistry).forEach(key => {
    const type = key.split('/')[0]${typeAnnotations.typeAssertion};
    types.add(type);
  });
  return Array.from(types);
};`;
};

const writeGlobalRegistry = (registry: SvgRegistry): void => {
  // Ensure dist directory exists
  if (!fs.existsSync("dist")) {
    fs.mkdirSync("dist", { recursive: true });
  }

  // Write the core registry as JavaScript
  const jsContent = generateRegistryCode(registry, false);
  fs.writeFileSync("dist/svg-registry.js", jsContent);

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
  console.log("Global registry written to dist/");
};

const writePackageRegistry = (registry: SvgRegistry, packageName: string): void => {
  const packageDir = `packages/${packageName}`;
  const srcDir = path.join(packageDir, "src");

  // Ensure src directory exists
  if (!fs.existsSync(srcDir)) {
    fs.mkdirSync(srcDir, { recursive: true });
  }

  // Generate the registry file as TypeScript
  const tsContent = generateRegistryCode(registry, true, true);
  const outputPath = path.join(packageDir, "src", "svg-registry.ts");
  fs.writeFileSync(outputPath, tsContent);
  console.log(`Package registry written to: ${outputPath}`);
};

const parseConfig = (): BuildConfig => {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--global") {
    return { mode: "global" };
  }

  if (args[0] === "--package" && args[1]) {
    return { mode: "package", packageName: args[1] };
  }

  // Legacy support: single argument is treated as package name
  if (args.length === 1 && !args[0].startsWith("--")) {
    return { mode: "package", packageName: args[0] };
  }

  console.error("Usage:");
  console.error("  tsx scripts/build-svg-registry.ts --global");
  console.error("  tsx scripts/build-svg-registry.ts --package <package-name>");
  console.error("  tsx scripts/build-svg-registry.ts <package-name> (legacy)");
  console.error("");
  console.error("Examples:");
  console.error("  tsx scripts/build-svg-registry.ts --global");
  console.error("  tsx scripts/build-svg-registry.ts --package web");
  console.error("  tsx scripts/build-svg-registry.ts web");
  process.exit(1);
};

const main = async (): Promise<void> => {
  const config = parseConfig();

  console.log(`Building SVG registry in ${config.mode} mode...`);

  const registry = await buildSvgRegistry();

  if (config.mode === "global") {
    writeGlobalRegistry(registry);
  } else {
    writePackageRegistry(registry, config.packageName!);
  }

  console.log(`SVG registry built with ${Object.keys(registry).length} icons`);
  console.log("Available icons:", Object.keys(registry));
};

main().catch(console.error);
