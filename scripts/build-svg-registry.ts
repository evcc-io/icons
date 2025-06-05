import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

interface IconFile {
  sourcePath: string; // Path to the .svg or .alias file
  svgPath: string; // Path to the actual SVG content
  type: string;
  name: string;
  key: string;
  isAlias: boolean;
  targetKey?: string; // For aliases, the key of the target SVG file
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

const processSvgContent = (filePath: string): string => {
  const content = fs.readFileSync(filePath, "utf8");

  // Remove XML declaration and DOCTYPE
  const cleanSvg = content
    .replace(/^<\?xml[^>]*\?>/, "")
    .replace(/<!DOCTYPE[^>]*>/, "")
    .trim();

  // Process colors to use CSS custom properties
  return processSvgColors(cleanSvg);
};

const resolveAliasFile = (aliasPath: string): string | null => {
  try {
    const content = fs.readFileSync(aliasPath, "utf8").trim();
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    if (lines.length !== 1) {
      console.warn(`Invalid alias file ${aliasPath}: must contain exactly one line`);
      return null;
    }

    const referencedFile = lines[0].trim();
    const aliasDir = path.dirname(aliasPath);
    const referencedPath = path.join(aliasDir, referencedFile);

    if (!fs.existsSync(referencedPath)) {
      console.warn(`Alias file ${aliasPath} references non-existent file: ${referencedFile}`);
      return null;
    }

    return referencedPath;
  } catch (error) {
    console.warn(`Failed to process alias file ${aliasPath}:`, error);
    return null;
  }
};

const createIconFileList = async (): Promise<IconFile[]> => {
  const svgFiles = await glob("src/**/*.svg");
  const aliasFiles = await glob("src/**/*.alias");
  const iconFiles: IconFile[] = [];

  // Process regular SVG files first to build a lookup map
  const svgPathToKey = new Map<string, string>();

  svgFiles.forEach((filePath) => {
    const relativePath = path.relative("src", filePath);
    const type = path.dirname(relativePath).replace(/s$/, "");
    const name = path.basename(relativePath, ".svg");
    const key = `${type}/${name}`;

    svgPathToKey.set(filePath, key);

    iconFiles.push({
      sourcePath: filePath,
      svgPath: filePath,
      type,
      name,
      key,
      isAlias: false,
    });
  });

  // Process alias files
  aliasFiles.forEach((aliasPath) => {
    const referencedSvgPath = resolveAliasFile(aliasPath);

    if (!referencedSvgPath) {
      return; // Skip invalid alias files
    }

    const relativePath = path.relative("src", aliasPath);
    const type = path.dirname(relativePath).replace(/s$/, "");
    const name = path.basename(aliasPath, ".alias");
    const key = `${type}/${name}`;
    const targetKey = svgPathToKey.get(referencedSvgPath);

    if (!targetKey) {
      console.warn(`Alias ${aliasPath} references SVG that is not in the processed list: ${referencedSvgPath}`);
      return;
    }

    iconFiles.push({
      sourcePath: aliasPath,
      svgPath: referencedSvgPath,
      type,
      name,
      key,
      isAlias: true,
      targetKey,
    });
  });

  return iconFiles;
};

const generateIconModules = async (): Promise<IconFile[]> => {
  const iconFiles = await createIconFileList();
  const iconsDir = "dist/icons";

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgFiles = iconFiles.filter((f) => !f.isAlias);
  const aliasFiles = iconFiles.filter((f) => f.isAlias);

  console.log(
    `Generating ${svgFiles.length} SVG modules (${aliasFiles.length} aliases will reference existing modules)...`,
  );

  // Only process actual SVG files - aliases will reference these in the registry
  svgFiles.forEach((iconFile) => {
    const cleanSvg = processSvgContent(iconFile.svgPath);

    // Generate the module content
    const moduleContent = `export default ${JSON.stringify(cleanSvg)};
`;

    // Write the module file
    const outputPath = path.join(iconsDir, `${iconFile.key.replace("/", "-")}.js`);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, moduleContent);
    console.log(`Generated SVG: ${outputPath}`);
  });

  // Log aliases but don't create files for them
  aliasFiles.forEach((iconFile) => {
    console.log(`Configured alias: ${iconFile.key} -> ${iconFile.targetKey}`);
  });

  return iconFiles;
};

const generateRegistry = (iconFiles: IconFile[]): string => {
  const registryEntries = iconFiles
    .map((iconFile) => {
      if (iconFile.isAlias && iconFile.targetKey) {
        // Alias points to the target SVG module
        const targetModuleKey = iconFile.targetKey.replace("/", "-");
        return `  "${iconFile.key}": () => import("./icons/${targetModuleKey}.js")`;
      }

      // Regular SVG file
      const moduleKey = iconFile.key.replace("/", "-");
      return `  "${iconFile.key}": () => import("./icons/${moduleKey}.js")`;
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

  // Generate individual icon modules and get their metadata
  const iconFiles = await generateIconModules();

  // Generate the registry file
  const registryContent = generateRegistry(iconFiles);
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
