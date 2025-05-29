import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

interface PackageJson {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

const PACKAGES = [
  { name: "core", path: "." },
  { name: "react", path: "packages/react" },
  { name: "vue", path: "packages/vue" },
  { name: "web", path: "packages/web" },
];

function readPackageJson(packagePath: string): PackageJson {
  const packageJsonPath = path.join(packagePath, "package.json");
  const content = fs.readFileSync(packageJsonPath, "utf8");
  return JSON.parse(content);
}

function writePackageJson(packagePath: string, packageJson: PackageJson): void {
  const packageJsonPath = path.join(packagePath, "package.json");
  fs.writeFileSync(
    packageJsonPath,

    `${JSON.stringify(packageJson, null, 2)}\n`,
  );
}

function incrementVersion(version: string, releaseType: "patch" | "minor" | "major"): string {
  const [major, minor, patch] = version.split(".").map(Number);

  switch (releaseType) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Invalid release type: ${releaseType}`);
  }
}

function run(command: string, cwd: string = process.cwd()): void {
  console.log(`Running: ${command} (in ${cwd})`);
  try {
    execSync(command, {
      cwd,
      stdio: "inherit",
      env: { ...process.env },
    });
  } catch (error) {
    console.error(`Failed to run command: ${command}`);
    process.exit(1);
  }
}

async function release(): Promise<void> {
  const releaseType = process.argv[2] as "patch" | "minor" | "major";

  if (!releaseType || !["patch", "minor", "major"].includes(releaseType)) {
    console.error("Usage: npm run release <patch|minor|major>");
    process.exit(1);
  }

  console.log(`🚀 Starting ${releaseType} release...`);

  // Read current version from core package
  const corePackage = readPackageJson(".");
  const currentVersion = corePackage.version;
  const newVersion = incrementVersion(currentVersion, releaseType);

  console.log(`📦 Bumping version from ${currentVersion} to ${newVersion}`);

  // Update version in all packages
  for (const pkg of PACKAGES) {
    console.log(`📝 Updating ${pkg.name} package.json...`);
    const packageJson = readPackageJson(pkg.path);
    packageJson.version = newVersion;

    // Update dependency reference for sub-packages
    if (pkg.name !== "core" && packageJson.dependencies?.["@evcc/icons"]) {
      // Keep the file reference for local development
      packageJson.dependencies["@evcc/icons"] = "file:../..";
    }

    writePackageJson(pkg.path, packageJson);
  }

  // Clean and build all packages
  console.log("🧹 Cleaning all packages...");
  run("npm run clean:all");

  console.log("🔨 Building core package...");
  run("npm run build");

  console.log("🔨 Building all packages...");
  run("npm run build:packages:clean");

  // Run tests
  console.log("🧪 Running tests...");
  run("npm run test:examples");

  // Publish packages in order (core first, then sub-packages)
  console.log("📤 Publishing packages...");

  // Login check
  try {
    run("npm whoami");
  } catch (error) {
    console.error("❌ You must be logged in to npm. Run 'npm login' first.");
    process.exit(1);
  }

  // Publish core package
  console.log("📤 Publishing core package...");
  run("npm publish --access public");

  // Wait a moment for NPM to process the core package
  console.log("⏳ Waiting for NPM to process core package...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Update sub-packages to use the published version
  for (const pkg of PACKAGES.slice(1)) {
    // Skip core package
    console.log(`📝 Updating ${pkg.name} to use published core version...`);
    const packageJson = readPackageJson(pkg.path);
    if (packageJson.dependencies?.["@evcc/icons"]) {
      packageJson.dependencies["@evcc/icons"] = `^${newVersion}`;
    }
    writePackageJson(pkg.path, packageJson);
  }

  // Rebuild sub-packages with published core dependency
  console.log("🔨 Rebuilding sub-packages with published dependencies...");
  run("cd packages/react && npm ci && npm run build");
  run("cd packages/vue && npm ci && npm run build");
  run("cd packages/web && npm ci && npm run build");

  // Publish sub-packages
  console.log("📤 Publishing React package...");
  run("npm publish --access public", "packages/react");

  console.log("📤 Publishing Vue package...");
  run("npm publish --access public", "packages/vue");

  console.log("📤 Publishing Web package...");
  run("npm publish --access public", "packages/web");

  // Restore file dependencies for development
  console.log("🔄 Restoring file dependencies for development...");
  for (const pkg of PACKAGES.slice(1)) {
    // Skip core package
    const packageJson = readPackageJson(pkg.path);
    if (packageJson.dependencies?.["@evcc/icons"]) {
      packageJson.dependencies["@evcc/icons"] = "file:../..";
    }
    writePackageJson(pkg.path, packageJson);
  }

  // Create git tag
  console.log("🏷️  Creating git tag...");
  run("git add .");
  run(`git commit -m "chore: release v${newVersion}"`);
  run(`git tag v${newVersion}`);

  console.log(`✅ Release v${newVersion} completed successfully!`);
  console.log(`   • Core: @evcc/icons@${newVersion}`);
  console.log(`   • React: @evcc/icons-react@${newVersion}`);
  console.log(`   • Vue: @evcc/icons-vue@${newVersion}`);
  console.log(`   • Web: @evcc/icons-web@${newVersion}`);
  console.log("");
  console.log("📌 Don't forget to:");
  console.log("   • Push the changes: git push && git push --tags");
  console.log("   • Create a GitHub release");
}

release().catch((error) => {
  console.error("❌ Release failed:", error);
  process.exit(1);
});
