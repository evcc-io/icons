#!/usr/bin/env node

import { access, readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

interface SVGDimensions {
  width?: string;
  height?: string;
  viewBox?: string;
}

// Whitelisted colors (case-insensitive)
const WHITELISTED_COLORS = [
  "#fff",
  "#000",
  "#4eb84b", // evcc green
  "none", // for transparent fills/strokes
];

// Standard SVG dimensions - using 120x120 as reference (from kia-niro-ev.svg)
const STANDARD_DIMENSIONS = {
  viewBox: "0 0 120 120",
  width: "100%",
  height: "100%",
};

const normalizeColor = (color: string): string => {
  return color.toLowerCase().trim();
};

const isColorWhitelisted = (color: string): boolean => {
  const normalized = normalizeColor(color);
  return WHITELISTED_COLORS.some((whitelisted) => normalizeColor(whitelisted) === normalized);
};

const extractColorsFromSVG = (svgContent: string): string[] => {
  const colors: Set<string> = new Set();

  // Extract colors from style attributes
  const styleMatches = svgContent.match(/style="[^"]*"/g) || [];
  styleMatches.forEach((style) => {
    // Extract fill colors
    const fillMatches = style.match(/fill:\s*([^;]+)/g) || [];
    fillMatches.forEach((fill) => {
      const color = fill.replace(/fill:\s*/, "").trim();
      if (color && color !== "none") {
        colors.add(color);
      }
    });

    // Extract stroke colors
    const strokeMatches = style.match(/stroke:\s*([^;]+)/g) || [];
    strokeMatches.forEach((stroke) => {
      const color = stroke.replace(/stroke:\s*/, "").trim();
      if (color && color !== "none") {
        colors.add(color);
      }
    });
  });

  // Extract colors from fill and stroke attributes
  const fillMatches = svgContent.match(/fill="([^"]*)"/g) || [];
  fillMatches.forEach((fill) => {
    const color = fill.replace(/fill="([^"]*)"/, "$1").trim();
    if (color && color !== "none") {
      colors.add(color);
    }
  });

  const strokeMatches = svgContent.match(/stroke="([^"]*)"/g) || [];
  strokeMatches.forEach((stroke) => {
    const color = stroke.replace(/stroke="([^"]*)"/, "$1").trim();
    if (color && color !== "none") {
      colors.add(color);
    }
  });

  return Array.from(colors);
};

const extractDimensionsFromSVG = (svgContent: string): SVGDimensions => {
  // Simple regex-based extraction since we don't need full XML parsing
  const viewBoxMatch = svgContent.match(/viewBox="([^"]*)"/);
  const widthMatch = svgContent.match(/width="([^"]*)"/);
  const heightMatch = svgContent.match(/height="([^"]*)"/);

  return {
    width: widthMatch?.[1],
    height: heightMatch?.[1],
    viewBox: viewBoxMatch?.[1],
  };
};

const dimensionsMatch = (dims: SVGDimensions): boolean => {
  return dims.viewBox === STANDARD_DIMENSIONS.viewBox;
};

const validateFilename = (filePath: string): string[] => {
  const errors: string[] = [];
  const filename = filePath.split("/").pop()!;
  const nameWithoutExtension = filename.replace(/\.(svg|alias)$/i, "");

  // Check if filename contains only alphanumeric characters and hyphens
  const validFilenamePattern = /^[a-zA-Z0-9\-]+$/;

  if (!validFilenamePattern.test(nameWithoutExtension)) {
    errors.push(
      `Invalid filename: "${filename}". Filenames must only contain alphanumeric characters and hyphens (a-z, A-Z, 0-9, -)`,
    );
  }

  // Check for consecutive hyphens
  if (nameWithoutExtension.includes("--")) {
    errors.push(`Invalid filename: "${filename}". Consecutive hyphens are not allowed`);
  }

  // Check for leading or trailing hyphens
  if (nameWithoutExtension.startsWith("-") || nameWithoutExtension.endsWith("-")) {
    errors.push(`Invalid filename: "${filename}". Filenames cannot start or end with hyphens`);
  }

  return errors;
};

const validateAliasFile = async (filePath: string): Promise<ValidationResult> => {
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };

  try {
    // Check if file has .alias extension
    if (extname(filePath).toLowerCase() !== ".alias") {
      result.errors.push("File is not an alias file (wrong extension)");
      return result;
    }

    // Validate filename format
    const filenameErrors = validateFilename(filePath);
    result.errors.push(...filenameErrors);

    // Read file content
    const content = await readFile(filePath, "utf-8");

    // Split content into lines and filter out empty lines
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Check if file has exactly one line
    if (lines.length === 0) {
      result.errors.push("Alias file is empty");
      return result;
    }

    if (lines.length > 1) {
      result.errors.push(`Alias file must contain exactly one line, found ${lines.length} lines`);
      return result;
    }

    const referencedFile = lines[0].trim();

    // Check if the referenced file has .svg extension
    if (extname(referencedFile).toLowerCase() !== ".svg") {
      result.errors.push(`Referenced file "${referencedFile}" is not an SVG file`);
    }

    // Check if the referenced SVG file exists in the same directory
    const aliasDir = dirname(filePath);
    const referencedFilePath = join(aliasDir, referencedFile);

    try {
      await access(referencedFilePath);
    } catch (error) {
      result.errors.push(`Referenced SVG file "${referencedFile}" does not exist in the same directory`);
    }
  } catch (error) {
    result.errors.push(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
};

const validateSVGFile = async (filePath: string): Promise<ValidationResult> => {
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };

  try {
    // Check if file has .svg extension
    if (extname(filePath).toLowerCase() !== ".svg") {
      result.errors.push("File is not an SVG file (wrong extension)");
      return result;
    }

    // Validate filename format
    const filenameErrors = validateFilename(filePath);
    result.errors.push(...filenameErrors);

    // Read and validate SVG content
    const content = await readFile(filePath, "utf-8");

    // Check if it's a valid SVG
    if (!content.includes("<svg")) {
      result.errors.push("File does not contain valid SVG content");
      return result;
    }

    // Extract and validate dimensions
    const dimensions = extractDimensionsFromSVG(content);

    if (!dimensionsMatch(dimensions)) {
      result.errors.push(
        `Dimensions mismatch. Expected viewBox: "${STANDARD_DIMENSIONS.viewBox}", ` + `got: "${dimensions.viewBox}"`,
      );
    }

    // Extract and validate colors
    const colors = extractColorsFromSVG(content);
    const invalidColors = colors.filter((color) => !isColorWhitelisted(color));

    if (invalidColors.length > 0) {
      result.errors.push(
        `Invalid colors found: ${invalidColors.join(", ")}. ` + `Only allowed: ${WHITELISTED_COLORS.join(", ")}`,
      );
    }

    if (colors.length === 0) {
      result.warnings.push("No colors found in SVG");
    }
  } catch (error) {
    result.errors.push(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
};

const getAllFiles = async (dir: string): Promise<{ svg: string[]; alias: string[] }> => {
  const svgFiles: string[] = [];
  const aliasFiles: string[] = [];

  const items = await readdir(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stats = await stat(fullPath);

    if (stats.isDirectory()) {
      const subFiles = await getAllFiles(fullPath);
      svgFiles.push(...subFiles.svg);
      aliasFiles.push(...subFiles.alias);
    } else {
      const ext = extname(fullPath).toLowerCase();
      if (ext === ".svg") {
        svgFiles.push(fullPath);
      } else if (ext === ".alias") {
        aliasFiles.push(fullPath);
      }
    }
  }

  return { svg: svgFiles, alias: aliasFiles };
};

const main = async (): Promise<void> => {
  const srcDir = join(process.cwd(), "src");

  console.log("🔍 Starting SVG and Alias Quality Control...\n");
  console.log(`📏 Standard dimensions: viewBox="${STANDARD_DIMENSIONS.viewBox}"`);
  console.log(`🎨 Whitelisted colors: ${WHITELISTED_COLORS.join(", ")}`);
  console.log("📝 Filename requirements: alphanumeric characters and hyphens only (a-z, A-Z, 0-9, -)");
  console.log("🔗 Alias requirements: exactly one line referencing an existing SVG file in the same directory\n");

  try {
    const allFiles = await getAllFiles(srcDir);
    const results: ValidationResult[] = [];

    console.log(`Found ${allFiles.svg.length} SVG files and ${allFiles.alias.length} alias files to validate\n`);

    // Validate SVG files
    for (const file of allFiles.svg) {
      const result = await validateSVGFile(file);
      results.push(result);
    }

    // Validate alias files
    for (const file of allFiles.alias) {
      const result = await validateAliasFile(file);
      results.push(result);
    }

    // Report results
    let hasErrors = false;
    let hasWarnings = false;

    for (const result of results) {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        console.log(`📁 ${result.file}`);

        if (result.errors.length > 0) {
          hasErrors = true;
          result.errors.forEach((error) => {
            console.log(`  ❌ ERROR: ${error}`);
          });
        }

        if (result.warnings.length > 0) {
          hasWarnings = true;
          result.warnings.forEach((warning) => {
            console.log(`  ⚠️  WARNING: ${warning}`);
          });
        }

        console.log("");
      }
    }

    // Summary
    const totalFiles = results.length;
    const filesWithErrors = results.filter((r) => r.errors.length > 0).length;
    const filesWithWarnings = results.filter((r) => r.warnings.length > 0).length;
    const validFiles = totalFiles - filesWithErrors;

    console.log("📊 Summary:");
    console.log(`  Total files: ${totalFiles} (${allFiles.svg.length} SVG, ${allFiles.alias.length} alias)`);
    console.log(`  Valid files: ${validFiles}`);
    console.log(`  Files with errors: ${filesWithErrors}`);
    console.log(`  Files with warnings: ${filesWithWarnings}`);
    console.log(`  Standard viewBox: "${STANDARD_DIMENSIONS.viewBox}"`);

    console.log("");

    if (hasErrors) {
      console.log("❌ Quality control failed! Please fix the errors above.");
      process.exit(1);
    } else if (hasWarnings) {
      console.log("⚠️  Quality control passed with warnings.");
      process.exit(0);
    } else {
      console.log("✅ All files passed quality control!");
      process.exit(0);
    }
  } catch (error) {
    console.error("💥 Failed to run quality control:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}
