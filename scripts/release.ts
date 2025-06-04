#!/usr/bin/env tsx

import { execSync } from "node:child_process";
import fs from "node:fs";

type VersionType = "patch" | "minor" | "major";

function run(command: string, cwd?: string): string {
  console.log(`$ ${command}`);
  const result = execSync(command, {
    encoding: "utf8",
    stdio: "inherit",
    cwd,
  });
  return result?.toString().trim() || "";
}

function getCurrentVersion(): string {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  return packageJson.version;
}

function updateVersion(newVersion: string): void {
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  packageJson.version = newVersion;
  fs.writeFileSync("package.json", `${JSON.stringify(packageJson, null, 2)}\n`);
}

function calculateNewVersion(currentVersion: string, versionType: VersionType): string {
  const [major, minor, patch] = currentVersion.split(".").map(Number);

  switch (versionType) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${versionType}`);
  }
}

function commitAndTag(version: string): void {
  run("git add .");
  run(`git commit -m "Release v${version}"`);
  run(`git tag v${version}`);
}

function publishPackage(): void {
  console.log("📤 Publishing package...");
  run("npm publish --access public");
}

function pushToGit(): void {
  run("git push origin main");
  run("git push origin --tags");
}

function main(): void {
  const args = process.argv.slice(2);
  const versionType: VersionType = (args[0] as VersionType) || "patch";

  if (!["patch", "minor", "major"].includes(versionType)) {
    console.error("Usage: tsx scripts/release.ts [patch|minor|major]");
    process.exit(1);
  }

  console.log("🚀 Starting release process...");

  // Check git status
  try {
    const gitStatus = execSync("git status --porcelain", { encoding: "utf8" });
    if (gitStatus.trim()) {
      console.error("❌ Working directory not clean. Please commit all changes first.");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to check git status");
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  const newVersion = calculateNewVersion(currentVersion, versionType);

  console.log(`📦 Current version: ${currentVersion}`);
  console.log(`📦 New version: ${newVersion}`);

  // Update version
  updateVersion(newVersion);

  // Build the package
  console.log("🔨 Building package...");
  run("npm run build");

  // Commit and tag
  console.log("📝 Creating commit and tag...");
  commitAndTag(newVersion);

  // Publish
  publishPackage();

  // Push to git
  console.log("📤 Pushing to git...");
  pushToGit();

  console.log("🎉 Release successful!");
  console.log("");
  console.log(`✅ Published @evcc/icons@${newVersion}`);
  console.log(`✅ Tagged as v${newVersion}`);
  console.log("✅ Pushed to git");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
