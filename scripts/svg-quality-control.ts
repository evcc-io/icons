#!/usr/bin/env node

import { access, readFile, readdir, stat } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import Fuse from "fuse.js";

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

interface ProductsData {
  [type: string]: {
    [productId: string]: {
      brand: string;
      description: string;
    };
  };
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

const loadProducts = async (): Promise<ProductsData | null> => {
  try {
    const productsContent = await readFile("products.json", "utf8");
    return JSON.parse(productsContent);
  } catch (error) {
    console.warn("⚠️  products.json not found or invalid - skipping product validation");
    return null;
  }
};

const findSimilarProduct = (productName: string, products: ProductsData, type: string): string | null => {
  if (!products[type]) return null;

  const productNames = Object.keys(products[type]);

  const fuse = new Fuse(productNames, {
    threshold: 0.3, // 0.3 = 70% similarity threshold
    includeScore: true,
  });

  const results = fuse.search(productName);

  // Return best match if it's above our similarity threshold
  if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.3) {
    return results[0].item;
  }

  return null;
};

const findSimilarSVGFile = async (targetFile: string, directory: string): Promise<string | null> => {
  try {
    const items = await readdir(directory);
    const svgFiles = items.filter((item) => extname(item).toLowerCase() === ".svg");

    if (svgFiles.length === 0) return null;

    const fuse = new Fuse(svgFiles, {
      threshold: 0.3, // 0.3 = 70% similarity threshold
      includeScore: true,
    });

    const results = fuse.search(targetFile);

    // Return best match if it's above our similarity threshold
    if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.3) {
      return results[0].item;
    }

    return null;
  } catch (error) {
    return null;
  }
};

const validateProductMatch = (filePath: string, products: ProductsData | null): string[] => {
  const errors: string[] = [];

  if (!products) {
    return errors; // Skip validation if products.json is not available
  }

  const relativePath = filePath.replace(/^.*\/src\//, ""); // Remove everything before /src/
  const type = dirname(relativePath);
  const isAlias = extname(filePath).toLowerCase() === ".alias";
  const extension = isAlias ? ".alias" : ".svg";
  const name = basename(relativePath, extension);

  // Skip product validation for files with *.ext.svg pattern
  if (!isAlias && name.endsWith(".ext")) {
    return errors;
  }

  // Skip validation for vehicle type (for now)
  if (type === "vehicle") {
    return errors;
  }

  // Check if the type exists in products.json
  if (!products[type]) {
    errors.push(`🏷️  Unknown type: ${type}`);
    return errors;
  }

  // Check if the product ID exists under the type
  if (!products[type][name]) {
    const suggestion = findSimilarProduct(name, products, type);
    const baseError = `🏷️  Unknown product: ${name}`;

    if (suggestion) {
      errors.push(`${baseError} (did you mean "${suggestion}"?)`);
    } else {
      errors.push(baseError);
    }
  }

  return errors;
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
  let nameWithoutExtension = filename.replace(/\.(svg|alias)$/i, "");

  // Remove .ext suffix if present (for .ext.svg pattern)
  nameWithoutExtension = nameWithoutExtension.replace(/\.ext$/, "");

  // Check if filename contains only alphanumeric characters and hyphens
  const validFilenamePattern = /^[a-zA-Z0-9\-]+$/;

  if (!validFilenamePattern.test(nameWithoutExtension)) {
    errors.push("📝  Invalid characters in filename (only a-z, A-Z, 0-9, - allowed)");
  }

  // Check for consecutive hyphens
  if (nameWithoutExtension.includes("--")) {
    errors.push("📝  Consecutive hyphens not allowed");
  }

  // Check for leading or trailing hyphens
  if (nameWithoutExtension.startsWith("-") || nameWithoutExtension.endsWith("-")) {
    errors.push("📝  Filename cannot start or end with hyphen");
  }

  return errors;
};

const validateAliasFile = async (filePath: string, products: ProductsData | null): Promise<ValidationResult> => {
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };

  try {
    // Check if file has .alias extension
    if (extname(filePath).toLowerCase() !== ".alias") {
      result.errors.push("🔗  Wrong file extension");
      return result;
    }

    // Validate filename format
    const filenameErrors = validateFilename(filePath);
    result.errors.push(...filenameErrors);

    // Validate product match (filename must match product key)
    const productErrors = validateProductMatch(filePath, products);
    result.errors.push(...productErrors);

    // Read file content
    const content = await readFile(filePath, "utf-8");

    // Split content into lines and filter out empty lines
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    // Check if file has exactly one line
    if (lines.length === 0) {
      result.errors.push("🔗  File is empty");
      return result;
    }

    if (lines.length > 1) {
      result.errors.push(`🔗  Must contain exactly one line (found ${lines.length})`);
      return result;
    }

    const referencedFile = lines[0].trim();

    // Validate alias content (referenced SVG file)
    if (extname(referencedFile).toLowerCase() !== ".svg") {
      result.errors.push(`🔗  Alias must reference SVG file: ${referencedFile}`);
    }

    // Check if the referenced SVG file exists in the same directory
    const aliasDir = dirname(filePath);
    const referencedFilePath = join(aliasDir, referencedFile);

    try {
      await access(referencedFilePath);
    } catch (error) {
      const suggestion = await findSimilarSVGFile(referencedFile, aliasDir);
      const baseError = `🔗  Referenced SVG file not found: ${referencedFile}`;

      if (suggestion) {
        result.errors.push(`${baseError} (did you mean "${suggestion}"?)`);
      } else {
        result.errors.push(baseError);
      }
    }
  } catch (error) {
    result.errors.push(`❌  Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
};

const validateSVGFile = async (filePath: string, products: ProductsData | null): Promise<ValidationResult> => {
  const result: ValidationResult = {
    file: filePath,
    errors: [],
    warnings: [],
  };

  try {
    // Check if file has .svg extension
    if (extname(filePath).toLowerCase() !== ".svg") {
      result.errors.push("🖼️  Wrong file extension");
      return result;
    }

    // Validate filename format
    const filenameErrors = validateFilename(filePath);
    result.errors.push(...filenameErrors);

    // Validate product match (filename must match product key)
    const productErrors = validateProductMatch(filePath, products);
    result.errors.push(...productErrors);

    // Read and validate SVG content
    const content = await readFile(filePath, "utf-8");

    // Check if it's a valid SVG
    if (!content.includes("<svg")) {
      result.errors.push("🖼️  Invalid SVG content");
      return result;
    }

    // Extract and validate dimensions
    const dimensions = extractDimensionsFromSVG(content);

    if (!dimensionsMatch(dimensions)) {
      result.errors.push(`📏  Wrong viewBox: "${dimensions.viewBox}" (expected: "${STANDARD_DIMENSIONS.viewBox}")`);
    }

    // Extract and validate colors
    const colors = extractColorsFromSVG(content);
    const invalidColors = colors.filter((color) => !isColorWhitelisted(color));

    if (invalidColors.length > 0) {
      result.errors.push(`🎨  Invalid colors: ${invalidColors.join(", ")}`);
    }

    if (colors.length === 0) {
      result.warnings.push("🎨  No colors found");
    }
  } catch (error) {
    result.errors.push(`❌  Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
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
  console.log("🔗 Alias requirements: exactly one line referencing an existing SVG file in the same directory");
  console.log("🏷️  Product validation: SVG and alias files must match valid product identifiers in products.json\n");

  try {
    const products = await loadProducts();
    const allFiles = await getAllFiles(srcDir);
    const results: ValidationResult[] = [];

    console.log(`Found ${allFiles.svg.length} SVG files and ${allFiles.alias.length} alias files to validate\n`);

    // Validate SVG files
    for (const file of allFiles.svg) {
      const result = await validateSVGFile(file, products);
      results.push(result);
    }

    // Validate alias files
    for (const file of allFiles.alias) {
      const result = await validateAliasFile(file, products);
      results.push(result);
    }

    // Report results
    let hasErrors = false;
    let hasWarnings = false;

    for (const result of results) {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        console.log(relative(process.cwd(), result.file));

        if (result.errors.length > 0) {
          hasErrors = true;
          result.errors.forEach((error) => {
            console.log(`  ${error}`);
          });
        }

        if (result.warnings.length > 0) {
          hasWarnings = true;
          result.warnings.forEach((warning) => {
            console.log(`  ${warning}`);
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
