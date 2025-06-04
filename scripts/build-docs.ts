import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

interface IconData {
  type: string;
  name: string;
  path: string;
}

const buildDocs = async (): Promise<void> => {
  console.log("Building documentation...");

  // Ensure docs directory exists
  if (!fs.existsSync("docs")) {
    fs.mkdirSync("docs", { recursive: true });
  }

  const svgFiles = await glob("src/**/*.svg");
  const icons: IconData[] = [];

  console.log(`Found ${svgFiles.length} SVG files`);

  svgFiles.forEach((filePath) => {
    // Extract type and name from path
    const relativePath = path.relative("src", filePath);
    const type = path.dirname(relativePath).replace(/s$/, ""); // remove 's' from vehicles -> vehicle
    const name = path.basename(relativePath, ".svg");

    icons.push({
      type,
      name,
      path: filePath,
    });
  });

  // Group icons by type
  const iconsByType = icons.reduce(
    (acc, icon) => {
      if (!acc[icon.type]) {
        acc[icon.type] = [];
      }
      acc[icon.type].push(icon);
      return acc;
    },
    {} as Record<string, IconData[]>,
  );

  // Sort icons by name within each type
  Object.keys(iconsByType).forEach((type) => {
    iconsByType[type].sort((a, b) => a.name.localeCompare(b.name));
  });

  // Define desired order: charger, meter, vehicles
  const typeOrder = ["charger", "meter", "vehicle"];
  const orderedIconTypes = typeOrder
    .filter((type) => iconsByType[type])
    .map((type) => [type, iconsByType[type]] as [string, IconData[]]);

  // Copy the built files to docs directory
  const webComponentsPath = "dist/evcc-icon.js";
  const lazyRegistryPath = "dist/svg-registry.js";
  const iconLoaderPath = "dist/icon-loader.js";
  const webComponentsMapPath = "dist/evcc-icon.js.map";
  const lazyRegistryMapPath = "dist/svg-registry.js.map";
  const iconLoaderMapPath = "dist/icon-loader.js.map";

  if (fs.existsSync(webComponentsPath)) {
    fs.copyFileSync(webComponentsPath, "docs/evcc-icon.js");
    console.log("Copied lazy-loading web components to docs/evcc-icon.js");
  } else {
    console.warn("Web components not found, make sure to run 'npm run build' first");
  }

  if (fs.existsSync(lazyRegistryPath)) {
    fs.copyFileSync(lazyRegistryPath, "docs/lazy-registry.js");
    console.log("Copied lazy registry to docs/lazy-registry.js");
  } else {
    console.warn("Lazy registry not found, make sure to run 'npm run build' first");
  }

  if (fs.existsSync(iconLoaderPath)) {
    fs.copyFileSync(iconLoaderPath, "docs/icon-loader.js");
    console.log("Copied icon loader to docs/icon-loader.js");
  } else {
    console.warn("Icon loader not found, make sure to run 'npm run build' first");
  }

  // Copy the icons directory
  const iconsDir = "dist/icons";
  const docsIconsDir = "docs/icons";
  if (fs.existsSync(iconsDir)) {
    if (fs.existsSync(docsIconsDir)) {
      fs.rmSync(docsIconsDir, { recursive: true });
    }
    fs.cpSync(iconsDir, docsIconsDir, { recursive: true });
    console.log("Copied individual icon modules to docs/icons/");
  } else {
    console.warn("Icons directory not found, make sure to run 'npm run build' first");
  }

  // Copy source map files if they exist
  if (fs.existsSync(webComponentsMapPath)) {
    fs.copyFileSync(webComponentsMapPath, "docs/evcc-icon.js.map");
    console.log("Copied web components source map to docs/evcc-icon.js.map");
  }

  if (fs.existsSync(lazyRegistryMapPath)) {
    fs.copyFileSync(lazyRegistryMapPath, "docs/lazy-registry.js.map");
    console.log("Copied lazy registry source map to docs/lazy-registry.js.map");
  }

  if (fs.existsSync(iconLoaderMapPath)) {
    fs.copyFileSync(iconLoaderMapPath, "docs/icon-loader.js.map");
    console.log("Copied icon loader source map to docs/icon-loader.js.map");
  }

  // Generate HTML documentation
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>evcc Icons Documentation</title>
    <style>
        @font-face {
            font-family: 'Roboto';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('https://evcc.io/fonts/roboto-v20-latin-regular.woff2') format('woff2');
        }
        
        @font-face {
            font-family: 'Roboto';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('https://evcc.io/fonts/roboto-v20-latin-bold.woff2') format('woff2');
        }
        
        body {
            font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            font-size: 24px;
        }
        h1 {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            font-size: 1.5rem;
        }
        h2 {
            font-size: 1.66rem;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .header__logo {
            height: 80px;
        }
        .header__logo__text {
            margin-top: 0.5rem;
        }
        .icon-section {
            margin-bottom: 3rem;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 1rem;
        }
        .icon-card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 0;
            text-align: center;
            transition: box-shadow 0.2s;
            cursor: pointer;
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
            position: relative;
            overflow: hidden;
        }
        .icon-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .icon-display {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        .icon-display evcc-icon {
            width: 100%;
            height: 100%;
        }
        .icon-name {
            font-size: 1.2rem;
            color: #333;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(4px);
            padding: 0.5rem 1rem;
            margin: 0;
            position: relative;
            z-index: 1;
            font-weight: 500;
            border-radius: 0 0 8px 8px;
            word-break: break-all;
        }
        .search-box {
            width: 100%;
            max-width: 400px;
            padding: 0.75rem 1rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            margin: 0 auto 2rem;
            display: block;
            background-color: #f8f9fa;
            transition: all 0.2s ease;
            outline: none;
        }
        .search-box:focus {
            border-color: #4eb84b;
            background-color: white;
            box-shadow: 0 0 0 3px rgba(78, 184, 75, 0.1);
        }
        .search-box::placeholder {
            color: #999;
        }
        .footer {
            margin-top: 4rem;
            padding: 2rem 0;
            border-top: 1px solid #e1e5e9;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
        }
        .footer a {
            color: #4eb84b;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        .footer-links {
            display: flex;
            justify-content: center;
            gap: 2rem;
            flex-wrap: wrap;
        }
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .overlay-content {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            max-width: 90vw;
            max-height: 90vh;
            text-align: center;
            position: relative;
            overflow: auto;
        }
        .overlay-icon {
            width: min(400px, 80vw);
            height: min(400px, 60vh);
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .overlay-icon evcc-icon {
            width: 100%;
            height: 100%;
        }
        .overlay-nav {
            background: rgba(0, 0, 0, 0.1);
            border: 1px solid #ddd;
            color: #333;
            font-size: 1.5rem;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            margin: 0 0.5rem;
        }
        .overlay-nav:hover {
            background: rgba(0, 0, 0, 0.2);
            border-color: #999;
        }
        .overlay-nav:disabled {
            opacity: 0.3;
            cursor: not-allowed;
        }
        .overlay-nav:disabled:hover {
            background: rgba(0, 0, 0, 0.1);
            border-color: #ddd;
        }
        .overlay-navigation {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 1rem;
            gap: 1rem;
        }
        .overlay-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
        .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            z-index: 1001;
        }
        .close-btn:hover {
            color: #000;
        }
        .overlay-title {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            color: #333;
        }
        .overlay-type {
            color: #666;
            font-size: 1rem;
        }
        .overlay-counter {
            color: #999;
            font-size: 0.9rem;
            margin-top: 0.5rem;
        }
        
        /* Large screen styles */
        @media (min-width: 1024px) {
            .overlay-content {
                padding: 3rem;
                max-width: 600px;
                max-height: 80vh;
            }
            .overlay-icon {
                width: min(500px, 70vw);
                height: min(500px, 50vh);
                margin-bottom: 2rem;
            }
            .overlay-nav {
                width: 50px;
                height: 50px;
                font-size: 1.8rem;
                margin: 0 1rem;
            }
            .overlay-navigation {
                margin-top: 2rem;
                gap: 2rem;
            }
            .overlay-title {
                font-size: 2rem;
                margin-bottom: 1rem;
            }
            .overlay-type {
                font-size: 1.2rem;
            }
            .overlay-counter {
                font-size: 1rem;
                margin-top: 1rem;
            }
            .close-btn {
                font-size: 2rem;
                top: 1.5rem;
                right: 1.5rem;
            }
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            .playground {
                padding: 1.5rem;
                margin: 2rem 0;
            }
            .playground-container {
                display: flex !important;
                flex-direction: column !important;
                align-items: stretch !important;
                gap: 1.5rem;
                margin: 0 auto;
                padding: 0 2rem;
            }
            .playground-controls {
                order: 1;
                padding: 1rem;
            }
            .playground-preview {
                order: 2;
                padding: 1rem;
            }
            .playground-preview {
                order: 2;
            }
            .preview-area {
                padding: 1.5rem;
                min-height: 150px;
            }
            .color-input-group {
                grid-template-columns: 50px 1fr;
            }
            .color-input-group input[type="color"] {
                width: 50px;
                height: 35px;
            }
            .overlay-content {
                padding: 1rem;
                margin: 1rem;
            }
            .overlay-icon {
                width: min(300px, 85vw);
                height: min(300px, 50vh);
            }
            .overlay-nav {
                width: 35px;
                height: 35px;
                font-size: 1.2rem;
            }
            .overlay-title {
                font-size: 1.2rem;
            }
            .close-btn {
                font-size: 1.2rem;
                top: 0.5rem;
                right: 0.5rem;
            }
            .icon-grid {
                grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                gap: 1rem;
            }
            .icon-display {
                padding: 0.75rem;
            }
            .icon-name {
                font-size: 0.8rem;
                padding: 0.4rem 0.75rem;
            }
            .footer-links {
                flex-direction: column;
                gap: 1rem;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 0.75rem;
            }
            .playground {
                padding: 1rem;
                margin: 1.5rem 0;
            }
            .playground-container {
                gap: 1rem;
                padding: 0 1rem;
            }
            .playground-controls {
                order: 1;
                padding: 1rem;
            }
            .playground-preview {
                order: 2;
                padding: 1rem;
            }
            .preview-area {
                padding: 1rem;
                min-height: 120px;
            }
            .overlay-icon {
                width: min(250px, 90vw);
                height: min(250px, 45vh);
            }
            .overlay-nav {
                width: 32px;
                height: 32px;
                font-size: 1rem;
            }
            .icon-grid {
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
                gap: 0.75rem;
            }
            .icon-display {
                padding: 0.5rem;
            }
            .icon-name {
                font-size: 0.75rem;
                padding: 0.3rem 0.5rem;
            }
        }
        .playground {
            margin: 4rem 0;
            padding: 2rem;
            background: #f8f9fa;
            border-radius: 12px;
            border: 1px solid #e1e5e9;
        }
        .playground h2 {
            margin-top: 0;
            margin-bottom: 0.5rem;
            color: #333;
            text-align: center;
        }
        .playground p {
            text-align: center;
            color: #666;
            margin-bottom: 2rem;
        }
        .playground-container {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: start;
        }
        .playground-preview {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            border: 1px solid #e1e5e9;
            text-align: center;
            flex: 1;
        }
        .playground-controls {
            background: white;
            border-radius: 8px;
            padding: 2rem;
            border: 1px solid #e1e5e9;
            flex: 0 0 auto;
        }
        .control-group {
            margin-bottom: 1.5rem;
        }
        .control-group:last-child {
            margin-bottom: 0;
        }
        .control-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #333;
        }
        .control-group select,
        .control-group input[type="text"],
        .control-group input[type="range"] {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            background: white;
            transition: border-color 0.2s ease;
        }
        .control-group select:focus,
        .control-group input[type="text"]:focus {
            outline: none;
            border-color: #4eb84b;
            box-shadow: 0 0 0 3px rgba(78, 184, 75, 0.1);
        }
        .color-input-group {
            display: grid;
            grid-template-columns: 60px 1fr;
            gap: 0.5rem;
            align-items: center;
        }
        .color-input-group input[type="color"] {
            width: 60px;
            height: 40px;
            padding: 0;
            border: 1px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
            background: white;
        }
        .color-input-group input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 2px;
        }
        .color-input-group input[type="color"]::-webkit-color-swatch {
            border: none;
            border-radius: 4px;
        }
        .color-input-group input[type="text"] {
            width: auto;
            max-width: 100%;
        }
        .control-group input[type="range"] {
            padding: 0;
            height: 8px;
            background: #e1e5e9;
            appearance: none;
        }
        .control-group input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4eb84b;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .control-group input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4eb84b;
            cursor: pointer;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .reset-btn {
            width: 100%;
            padding: 0.75rem 1.5rem;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        .reset-btn:hover {
            background: #5a6268;
        }
        .preview-area {
            margin-bottom: 1.5rem;
            padding: 2rem;
            border: 2px dashed #e1e5e9;
            border-radius: 8px;
            min-height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
        }
        .preview-area evcc-icon {
            width: 100%;
            height: 100%;
        }
        .preview-info {
            background: #f8f9fa;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #e1e5e9;
        }
        .preview-info code {
            white-space: pre-wrap;
            overflow-wrap: break-word;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.85rem;
            color: #666;
            line-height: 1.4;
            text-align: left;
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 76" class="header__logo">
                <title>evcc Logo</title>
                <path d="M37.54 51.18a12.38 12.38 0 01-9-3.42A12.19 12.19 0 0125 38.64V38a15.4 15.4 0 011.47-6.83 10.82 10.82 0 014.17-4.64 11.63 11.63 0 016.15-1.63A10.44 10.44 0 0145 28.16q3 3.29 3 9.31v2.76H31.84a6.35 6.35 0 002 4A6 6 0 0038 45.72a7.3 7.3 0 006.1-2.84l3.31 3.73A10 10 0 0143.28 50a13.32 13.32 0 01-5.74 1.18zm-.77-20.84a4.21 4.21 0 00-3.26 1.37 7.14 7.14 0 00-1.6 3.91h9.39v-.55a5 5 0 00-1.22-3.49 4.3 4.3 0 00-3.31-1.24zM60.91 42.44l4.7-17.09h7l-8.48 25.36h-6.44l-8.52-25.36h7zM110 45.72a4.45 4.45 0 003-1 3.64 3.64 0 001.22-2.75h6.32a8.67 8.67 0 01-1.4 4.73 9.15 9.15 0 01-3.79 3.3 11.75 11.75 0 01-5.29 1.19 10.91 10.91 0 01-8.54-3.46q-3.13-3.45-3.13-9.55v-.45q0-5.85 3.1-9.35a10.86 10.86 0 018.51-3.5 10.59 10.59 0 017.6 2.71 9.62 9.62 0 012.9 7.21h-6.3a4.66 4.66 0 00-1.2-3.22 4 4 0 00-3.08-1.24 4.06 4.06 0 00-3.56 1.73c-.8 1.15-1.2 3-1.2 5.6v.7c0 2.61.39 4.49 1.19 5.63a4.09 4.09 0 003.65 1.72zM134.88 45.72a4.46 4.46 0 003-1 3.63 3.63 0 001.21-2.75h6.33a8.67 8.67 0 01-1.4 4.73 9.15 9.15 0 01-3.73 3.3 11.78 11.78 0 01-5.29 1.18 10.91 10.91 0 01-8.54-3.46q-3.13-3.45-3.13-9.55v-.45q0-5.85 3.1-9.35a10.84 10.84 0 018.57-3.49 10.57 10.57 0 017.6 2.71 9.59 9.59 0 012.91 7.21h-6.33a4.65 4.65 0 00-1.21-3.22 4.49 4.49 0 00-6.64.49c-.8 1.15-1.21 3-1.21 5.6v.7q0 3.91 1.2 5.63a4.09 4.09 0 003.56 1.72z" class="header__logo__letters"></path>
                <path d="M82.92 22.86h9.22L86 35.16h6.15L80.62 56.67l2.3-15.36h-7.68z" fill="#0fdd42"></path>
                <path d="M0 0h170v76H0z" fill="none"></path>
            </svg>
            <span class="header__logo__text">icons</span>
        </h1>
        <p>A collection of icons for electric vehicle charging infrastructure</p>
        <input type="search" class="search-box" placeholder="Search icons..." id="searchBox">
    </div>

    ${orderedIconTypes
      .map(
        ([type, typeIcons]) => `
    <div class="icon-section" data-type="${type}">
        <h2>${type.charAt(0).toUpperCase() + type.slice(1)}s (${typeIcons.length})</h2>
        <div class="icon-grid">
            ${typeIcons
              .map(
                (icon) => `
            <div class="icon-card" data-name="${icon.name}" onclick="showOverlay('${icon.name}', '${type}')">
                <div class="icon-display">
                    <evcc-icon type="${type}" name="${icon.name}"></evcc-icon>
                </div>
                <div class="icon-name">${icon.name}</div>
            </div>
            `,
              )
              .join("")}
        </div>
    </div>
    `,
      )
      .join("")}

    <div class="overlay" id="overlay" onclick="hideOverlay()">
        <div class="overlay-content" onclick="event.stopPropagation()">
            <button class="close-btn" onclick="hideOverlay()">&times;</button>
            <div class="overlay-icon" id="overlayIcon">
                <evcc-icon id="overlayIconComponent" type="vehicle" name="kia-niro-ev"></evcc-icon>
            </div>
            <div class="overlay-info">
                <div class="overlay-title" id="overlayTitle"></div>
                <div class="overlay-type" id="overlayType"></div>
                <div class="overlay-counter" id="overlayCounter"></div>
            </div>
            <div class="overlay-navigation">
                <button class="overlay-nav overlay-nav-left" id="overlayNavLeft" onclick="navigateOverlay(-1)">‹</button>
                <button class="overlay-nav overlay-nav-right" id="overlayNavRight" onclick="navigateOverlay(1)">›</button>
            </div>
        </div>
    </div>

    <div class="playground">
        <h2>🎮 Interactive Playground</h2>
        <p>Experiment with different icons, colors, and sizes using the evcc-icon web component:</p>
        
        <div class="playground-container">
            <div class="playground-controls">
                <div class="control-group">
                    <label for="iconSelect">Icon:</label>
                    <select id="iconSelect">
                        ${orderedIconTypes
                          .map(([type, typeIcons]) =>
                            typeIcons
                              .map(
                                (icon) =>
                                  `<option value="${type}/${icon.name}"${type === "vehicle" && icon.name === "kia-niro-ev" ? " selected" : ""}>${type}/${icon.name}</option>`,
                              )
                              .join(""),
                          )
                          .join("")}
                    </select>
                </div>
                
                <div class="control-group">
                    <label for="accentColor">Accent Color:</label>
                    <div class="color-input-group">
                        <input type="color" id="accentColor" value="#4eb84b">
                        <input type="text" id="accentColorText" value="#4eb84b" placeholder="#4eb84b">
                    </div>
                </div>
                
                <div class="control-group">
                    <label for="outlineColor">Outline Color:</label>
                    <div class="color-input-group">
                        <input type="color" id="outlineColor" value="#000000">
                        <input type="text" id="outlineColorText" value="#000000" placeholder="#000000">
                    </div>
                </div>
                
                <div class="control-group">
                    <button id="resetBtn" class="reset-btn">Reset to Defaults</button>
                </div>
            </div>
            
            <div class="playground-preview">
                <div class="preview-area">
                    <evcc-icon 
                        id="playgroundIcon" 
                        type="vehicle" 
                        name="kia-niro-ev"
                        accent-color="#4eb84b"
                        outline-color="#000"
                    ></evcc-icon>
                </div>
                <div class="preview-info">
                    <code id="playgroundCode">&lt;evcc-icon type="vehicle" name="kia-niro-ev" accent-color="#4eb84b" outline-color="#000"&gt;&lt;/evcc-icon&gt;</code>
                </div>
            </div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-links">
            <a href="https://evcc.io">evcc.io</a>
            <a href="https://github.com/evcc-io/icons">GitHub</a>
        </div>
    </div>

    <script type="module" src="./lazy-registry.js"></script>
    <script type="module" src="./icon-loader.js"></script>
    <script type="module" src="./evcc-icon.js"></script>
    <script type="module">
        // Navigation state
        let currentIconIndex = 0;
        let currentIconList = [];
        let currentType = '';

        // Create a flat list of all icons for navigation
        const allIcons = [
            ${orderedIconTypes
              .map(([type, typeIcons]) =>
                typeIcons.map((icon) => `{ name: '${icon.name}', type: '${type}' }`).join(","),
              )
              .join(",")}
        ];

        function showOverlay(name, type) {
            // Find the current icon in the full list
            currentIconIndex = allIcons.findIndex(icon => icon.name === name);
            currentIconList = allIcons;
            currentType = type;
            
            updateOverlayContent();
            document.getElementById('overlay').style.display = 'flex';
            
            // Also update the playground preview when clicking on an icon tile
            setPlaygroundIcon(type, name);
        }

        function updateOverlayContent() {
            const icon = currentIconList[currentIconIndex];
            const overlayComponent = document.getElementById('overlayIconComponent');
            
            // Update the web component attributes
            overlayComponent.setAttribute('type', icon.type);
            overlayComponent.setAttribute('name', icon.name);
            
            document.getElementById('overlayTitle').textContent = icon.name;
            document.getElementById('overlayType').textContent = icon.type;
            document.getElementById('overlayCounter').textContent = \`\${currentIconIndex + 1} of \${currentIconList.length}\`;
            
            // Update navigation button states
            const leftBtn = document.getElementById('overlayNavLeft');
            const rightBtn = document.getElementById('overlayNavRight');
            
            leftBtn.disabled = currentIconIndex === 0;
            rightBtn.disabled = currentIconList.length === 1 || currentIconIndex === currentIconList.length - 1;
        }

        function navigateOverlay(direction) {
            const newIndex = currentIconIndex + direction;
            
            if (newIndex >= 0 && newIndex < currentIconList.length) {
                currentIconIndex = newIndex;
                updateOverlayContent();
            }
        }

        function hideOverlay() {
            document.getElementById('overlay').style.display = 'none';
        }

        // Close overlay with Escape key, navigate with arrow keys
        document.addEventListener('keydown', function(e) {
            const overlay = document.getElementById('overlay');
            if (overlay.style.display === 'flex') {
                switch(e.key) {
                    case 'Escape':
                        hideOverlay();
                        break;
                    case 'ArrowLeft':
                        e.preventDefault();
                        navigateOverlay(-1);
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        navigateOverlay(1);
                        break;
                }
            }
        });

        // Search functionality
        document.getElementById('searchBox').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const iconCards = document.querySelectorAll('.icon-card');
            
            iconCards.forEach(card => {
                const iconName = card.dataset.name.toLowerCase();
                const isVisible = iconName.includes(searchTerm);
                card.style.display = isVisible ? 'block' : 'none';
            });
        });

        // Make functions global for onclick handlers
        window.showOverlay = showOverlay;
        window.hideOverlay = hideOverlay;
        window.navigateOverlay = navigateOverlay;

        // Playground functionality
        const playgroundIcon = document.getElementById('playgroundIcon');
        const playgroundCode = document.getElementById('playgroundCode');
        const iconSelect = document.getElementById('iconSelect');
        const accentColor = document.getElementById('accentColor');
        const accentColorText = document.getElementById('accentColorText');
        const outlineColor = document.getElementById('outlineColor');
        const outlineColorText = document.getElementById('outlineColorText');
        const resetBtn = document.getElementById('resetBtn');

        const updatePlaygroundIcon = () => {
            const [type, name] = iconSelect.value.split('/');
            const accentColorVal = accentColor.value;
            const outlineColorVal = outlineColor.value;

            // Update the web component
            playgroundIcon.setAttribute('type', type);
            playgroundIcon.setAttribute('name', name);
            playgroundIcon.setAttribute('accent-color', accentColorVal);
            playgroundIcon.setAttribute('outline-color', outlineColorVal);

            // Update the code display
            const codeLines = [
                '<evcc-icon',
                '  type="' + type + '"',
                '  name="' + name + '"',
                '  accent-color="' + accentColorVal + '"',
                '  outline-color="' + outlineColorVal + '"',
                '></evcc-icon>'
            ];
            playgroundCode.textContent = codeLines.join('\\n');

            // Sync color inputs
            accentColorText.value = accentColorVal;
            outlineColorText.value = outlineColorVal;
        };

        const resetPlayground = () => {
            iconSelect.value = 'vehicle/kia-niro-ev';
            accentColor.value = '#4eb84b';
            accentColorText.value = '#4eb84b';
            outlineColor.value = '#000000';
            outlineColorText.value = '#000000';
            updatePlaygroundIcon();
        };

        const setPlaygroundIcon = (type, name) => {
            const iconSelect = document.getElementById('iconSelect');
            const value = \`\${type}/\${name}\`;
            iconSelect.value = value;
            updatePlaygroundIcon();
        };

        // Make setPlaygroundIcon global after it's defined
        window.setPlaygroundIcon = setPlaygroundIcon;

        // Add click handler to overlay icon to set it in playground
        document.getElementById('overlayIconComponent').addEventListener('click', function() {
            const icon = currentIconList[currentIconIndex];
            setPlaygroundIcon(icon.type, icon.name);
        });

        // Event listeners
        iconSelect.addEventListener('change', updatePlaygroundIcon);
        accentColor.addEventListener('input', updatePlaygroundIcon);
        outlineColor.addEventListener('input', updatePlaygroundIcon);
        resetBtn.addEventListener('click', resetPlayground);

        // Sync text inputs with color pickers
        accentColorText.addEventListener('input', (e) => {
            const value = e.target.value;
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            if (hexPattern.test(value)) {
                accentColor.value = value;
                updatePlaygroundIcon();
            }
        });

        outlineColorText.addEventListener('input', (e) => {
            const value = e.target.value;
            const hexPattern = /^#[0-9A-Fa-f]{6}$/;
            if (hexPattern.test(value)) {
                outlineColor.value = value;
                updatePlaygroundIcon();
            }
        });
    </script>
</body>
</html>`;

  fs.writeFileSync("docs/index.html", htmlContent);
  console.log(`Documentation built with ${icons.length} icons using web components`);
  console.log("Documentation available at: docs/index.html");
};

buildDocs().catch(console.error);
