const fs = require("fs");
const path = require("path");

console.log("🧪 Testing evcc Icons build output...\n");

// Test 1: Check if all dist directories exist
const distDirs = ["dist/react", "dist/vue", "dist/web"];
distDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} exists`);
  } else {
    console.log(`❌ ${dir} missing`);
    process.exit(1);
  }
});

// Test 2: Check if SVG registry exists and has content
distDirs.forEach((dir) => {
  const registryPath = path.join(dir, "svg-registry.js");
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, "utf8");
    if (
      content.includes("vehicle/kia-niro-ev") &&
      content.includes("var(--evcc-accent-color")
    ) {
      console.log(`✅ ${dir}/svg-registry.js has correct content`);
    } else {
      console.log(`❌ ${dir}/svg-registry.js has incorrect content`);
      process.exit(1);
    }
  } else {
    console.log(`❌ ${dir}/svg-registry.js missing`);
    process.exit(1);
  }
});

// Test 3: Check if main component files exist
const componentFiles = [
  "dist/react/EvccIcon.jsx",
  "dist/react/index.js",
  "dist/react/index.d.ts",
  "dist/vue/EvccIcon.vue",
  "dist/vue/index.js",
  "dist/web/evcc-icon.js",
  "dist/web/index.js",
];

componentFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    process.exit(1);
  }
});

// Test 4: Try to import the SVG registry
try {
  const { svgRegistry } = require("../dist/react/svg-registry.js");
  const iconKeys = Object.keys(svgRegistry);

  if (iconKeys.length > 0) {
    console.log(
      `✅ SVG registry loaded with ${iconKeys.length} icons: ${iconKeys.join(
        ", "
      )}`
    );
  } else {
    console.log("❌ SVG registry is empty");
    process.exit(1);
  }

  // Check if the icon content has CSS variables
  const iconContent = svgRegistry["vehicle/kia-niro-ev"];
  if (
    iconContent &&
    iconContent.includes("var(--evcc-accent-color") &&
    iconContent.includes("var(--evcc-outline-color")
  ) {
    console.log(
      "✅ Icon content has CSS custom properties for color customization"
    );
  } else {
    console.log("❌ Icon content missing CSS custom properties");
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Failed to import SVG registry: ${error.message}`);
  process.exit(1);
}

console.log("\n🎉 All tests passed! The evcc Icons package is ready to use.");
console.log("\n📦 Package exports:");
console.log("  - evcc-icons/react  → React component");
console.log("  - evcc-icons/vue    → Vue component");
console.log("  - evcc-icons/web    → Web component");
console.log("\n🎨 Customizable colors:");
console.log("  - accentColor/accent-color   → Default: #4eb84b");
console.log("  - outlineColor/outline-color → Default: #000");
console.log("\n📖 See README.md for usage examples.");
