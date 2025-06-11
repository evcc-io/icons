#!/usr/bin/env node

import { readFile, readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";

interface ProductsData {
  [type: string]: {
    [productId: string]: {
      brand: string;
      description: string;
    };
  };
}

interface CoverageStats {
  type: string;
  totalProducts: number;
  coveredProducts: number;
  missingProducts: string[];
}

const loadProducts = async (): Promise<ProductsData> => {
  try {
    const productsContent = await readFile("products.json", "utf8");
    return JSON.parse(productsContent);
  } catch (error) {
    console.error("❌ Failed to load products.json");
    process.exit(1);
  }
};

const getAvailableIcons = async (type: string): Promise<Set<string>> => {
  const iconSet = new Set<string>();
  const dirPath = join("src", type);

  try {
    const files = await readdir(dirPath);

    for (const file of files) {
      const ext = extname(file).toLowerCase();
      if (ext === ".svg" || ext === ".alias") {
        let iconName = basename(file, ext);

        // Handle .ext.svg files (remove .ext suffix)
        if (iconName.endsWith(".ext")) {
          iconName = iconName.slice(0, -4);
        }

        iconSet.add(iconName);
      }
    }
  } catch (error) {
    // Directory doesn't exist, return empty set
  }

  return iconSet;
};

const calculateCoverage = async (products: ProductsData): Promise<CoverageStats[]> => {
  const coverageStats: CoverageStats[] = [];

  for (const type of Object.keys(products)) {
    const productKeys = Object.keys(products[type] || {});
    const availableIcons = await getAvailableIcons(type);

    const missingProducts = productKeys.filter((key) => !availableIcons.has(key));

    coverageStats.push({
      type,
      totalProducts: productKeys.length,
      coveredProducts: productKeys.length - missingProducts.length,
      missingProducts,
    });
  }

  return coverageStats;
};

const createProgressBar = (covered: number, total: number, width = 40): string => {
  if (total === 0) return "░".repeat(width);

  const percentage = covered / total;
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  return "█".repeat(filled) + "░".repeat(empty);
};

const formatPercentage = (covered: number, total: number): string => {
  if (total === 0) return "  0.0%";
  return `${((covered / total) * 100).toFixed(1).padStart(5)}%`;
};

const main = async (): Promise<void> => {
  console.log("🔍 Checking icon coverage against products.json...\n");

  const products = await loadProducts();
  const coverageStats = await calculateCoverage(products);

  // Sort by type name for consistent output
  coverageStats.sort((a, b) => a.type.localeCompare(b.type));

  // Filter out types with no products
  const relevantStats = coverageStats.filter((stat) => stat.totalProducts > 0);

  // Display missing icons per type
  for (const stat of relevantStats) {
    if (stat.missingProducts.length > 0) {
      console.log(`📋 Missing ${stat.type} icons (${stat.missingProducts.length}/${stat.totalProducts}):`);

      // Display one product per line
      stat.missingProducts.forEach((product) => {
        console.log(`   ${product}`);
      });
      console.log();
    }
  }

  // Display ASCII progress indicators
  console.log("📊 Coverage Summary:");

  // Find the longest type name for proper alignment
  const maxTypeLength = Math.max(...relevantStats.map((stat) => stat.type.length));

  // Calculate table width: │ + space + typeName + space + progressBar + space + percentage + space + counts + space + │
  const tableWidth = 2 + maxTypeLength + 1 + 40 + 1 + 6 + 1 + 7 + 2;
  const borderLine = "─".repeat(tableWidth - 2);

  console.log(`┌${borderLine}┐`);

  for (const stat of relevantStats) {
    const progressBar = createProgressBar(stat.coveredProducts, stat.totalProducts);
    const percentage = formatPercentage(stat.coveredProducts, stat.totalProducts);
    const counts = `${stat.coveredProducts.toString().padStart(3)}/${stat.totalProducts.toString().padStart(3)}`;
    const typeName = stat.type.padEnd(maxTypeLength);

    console.log(`│ ${typeName} ${progressBar} ${percentage} ${counts} │`);
  }

  console.log(`└${borderLine}┘`);

  // Summary stats
  const totalProducts = relevantStats.reduce((sum, stat) => sum + stat.totalProducts, 0);
  const totalCovered = relevantStats.reduce((sum, stat) => sum + stat.coveredProducts, 0);
  const totalMissing = totalProducts - totalCovered;

  console.log();
  console.log(
    `📈 Overall: ${totalCovered}/${totalProducts} icons available (${formatPercentage(totalCovered, totalProducts).trim()})`,
  );

  if (totalMissing > 0) {
    console.log(`⚠️  ${totalMissing} icons missing`);
  } else {
    console.log("✅ All products have icons!");
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
}
