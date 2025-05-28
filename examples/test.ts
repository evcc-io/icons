import fs from "node:fs";
import path from "node:path";

const runTests = async (): Promise<void> => {
	console.log("🧪 Testing evcc Icons TypeScript build output...\n");

	// Test 1: Check if core dist directory exists
	if (fs.existsSync("dist")) {
		console.log("✅ Core dist directory exists");
	} else {
		console.log("❌ Core dist directory missing");
		process.exit(1);
	}

	// Test 2: Check if package dist directories exist
	const packageDirs = [
		"packages/react/dist",
		"packages/vue/dist",
		"packages/web/dist",
	];
	packageDirs.forEach((dir) => {
		if (fs.existsSync(dir)) {
			console.log(`✅ ${dir} exists`);
		} else {
			console.log(`❌ ${dir} missing`);
			process.exit(1);
		}
	});

	// Test 3: Check if core SVG registry exists and has content
	const coreRegistryPath = "dist/svg-registry.js";
	if (fs.existsSync(coreRegistryPath)) {
		const content = fs.readFileSync(coreRegistryPath, "utf8");
		if (
			content.includes("vehicle/kia-niro-ev") &&
			content.includes("var(--evcc-accent-color")
		) {
			console.log("✅ Core svg-registry.js has correct content");
		} else {
			console.log("❌ Core svg-registry.js has incorrect content");
			process.exit(1);
		}
	} else {
		console.log("❌ Core svg-registry.js missing");
		process.exit(1);
	}

	// Test 4: Check if TypeScript declaration file exists
	const declarationPath = "dist/svg-registry.d.ts";
	if (fs.existsSync(declarationPath)) {
		const content = fs.readFileSync(declarationPath, "utf8");
		if (content.includes("IconType") && content.includes("SvgRegistry")) {
			console.log("✅ TypeScript declarations exist and are correct");
		} else {
			console.log("❌ TypeScript declarations are incorrect");
			process.exit(1);
		}
	} else {
		console.log("❌ TypeScript declarations missing");
		process.exit(1);
	}

	// Test 5: Check if package component files exist
	const componentFiles = [
		"packages/react/dist/EvccIcon.js",
		"packages/react/dist/EvccIcon.d.ts",
		"packages/react/dist/index.js",
		"packages/react/dist/index.d.ts",
		"packages/vue/dist/index.js",
		"packages/vue/dist/index.d.ts",
		"packages/web/dist/evcc-icon.js",
		"packages/web/dist/evcc-icon.d.ts",
		"packages/web/dist/index.js",
		"packages/web/dist/index.d.ts",
	];

	componentFiles.forEach((file) => {
		if (fs.existsSync(file)) {
			console.log(`✅ ${file} exists`);
		} else {
			console.log(`❌ ${file} missing`);
		}
	});

	// Test 6: Try to import the SVG registry
	try {
		const registryModule = await import("../dist/svg-registry.js");
		const { svgRegistry } = registryModule;
		const iconKeys = Object.keys(svgRegistry);

		if (iconKeys.length > 0) {
			console.log(
				`✅ SVG registry loaded with ${iconKeys.length} icons: ${iconKeys.join(
					", ",
				)}`,
			);
		} else {
			console.log("❌ SVG registry is empty");
			process.exit(1);
		}

		// Check if the icon content has CSS variables
		const iconContent = svgRegistry["vehicle/kia-niro-ev"];
		if (
			iconContent?.includes("var(--evcc-accent-color") &&
			iconContent.includes("var(--evcc-outline-color")
		) {
			console.log(
				"✅ Icon content has CSS custom properties for color customization",
			);
		} else {
			console.log("❌ Icon content missing CSS custom properties");
			process.exit(1);
		}
	} catch (error) {
		console.log(
			`❌ Failed to import SVG registry: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
		process.exit(1);
	}

	console.log(
		"\n🎉 All TypeScript tests passed! The evcc Icons package is ready to use.",
	);
	console.log("\n📦 Package exports:");
	console.log("  - @evcc/icons-react → React component with TypeScript");
	console.log("  - @evcc/icons-vue   → Vue component with TypeScript");
	console.log("  - @evcc/icons-web   → Web component with TypeScript");
	console.log("  - @evcc/icons       → Core registry with TypeScript");
	console.log("\n🎨 Customizable colors:");
	console.log("  - accentColor/accent-color   → Default: #4eb84b");
	console.log("  - outlineColor/outline-color → Default: #000");
	console.log("\n📖 See README.md for usage examples with TypeScript support.");
};

runTests().catch(console.error);
