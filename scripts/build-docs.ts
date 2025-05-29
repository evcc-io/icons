import fs from "node:fs";
import path from "node:path";
import { glob } from "glob";

interface IconData {
  type: string;
  name: string;
  path: string;
  svg: string;
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
    const content = fs.readFileSync(filePath, "utf8");

    // Clean SVG content
    const cleanSvg = content
      .replace(/^<\?xml[^>]*\?>/, "")
      .replace(/<!DOCTYPE[^>]*>/, "")
      .trim();

    // Extract type and name from path
    const relativePath = path.relative("src", filePath);
    const type = path.dirname(relativePath).replace(/s$/, ""); // remove 's' from vehicles -> vehicle
    const name = path.basename(relativePath, ".svg");

    icons.push({
      type,
      name,
      path: filePath,
      svg: cleanSvg,
    });
  });

  // Group icons by type
  const iconsByType = icons.reduce((acc, icon) => {
    if (!acc[icon.type]) {
      acc[icon.type] = [];
    }
    acc[icon.type].push(icon);
    return acc;
  }, {} as Record<string, IconData[]>);

  // Create SVG data object for JavaScript
  const svgData = icons.reduce((acc, icon) => {
    acc[icon.name] = icon.svg;
    return acc;
  }, {} as Record<string, string>);

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
        .icon-display svg {
            width: 100%;
            height: 100%;
            object-fit: contain;
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
            width: 100%;
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
        .overlay-icon svg {
            max-width: 100%;
            max-height: 100%;
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
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            .overlay-content {
                padding: 1rem;
                margin: 1rem;
            }
            .overlay-icon {
                width: min(300px, 85vw);
                height: min(300px, 50vh);
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
            .overlay-icon {
                width: min(250px, 90vw);
                height: min(250px, 45vh);
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

    ${Object.entries(iconsByType)
      .map(
        ([type, typeIcons]) => `
    <div class="icon-section" data-type="${type}">
        <h2>${type.charAt(0).toUpperCase() + type.slice(1)}s (${
          typeIcons.length
        })</h2>
        <div class="icon-grid">
            ${typeIcons
              .map(
                (icon) => `
            <div class="icon-card" data-name="${icon.name}" onclick="showOverlay('${icon.name}', '${type}')">
                <div class="icon-display">
                    ${icon.svg}
                </div>
                <div class="icon-name">${icon.name}</div>
            </div>
            `
              )
              .join("")}
        </div>
    </div>
    `
      )
      .join("")}

    <div class="overlay" id="overlay" onclick="hideOverlay()">
        <div class="overlay-content" onclick="event.stopPropagation()">
            <button class="close-btn" onclick="hideOverlay()">&times;</button>
            <div class="overlay-icon" id="overlayIcon"></div>
            <div class="overlay-title" id="overlayTitle"></div>
            <div class="overlay-type" id="overlayType"></div>
        </div>
    </div>

    <div class="footer">
        <div class="footer-links">
            <a href="https://evcc.io">evcc.io</a>
            <a href="https://github.com/evcc-io/icons">GitHub</a>
        </div>
    </div>

    <script>
        // SVG data object
        const svgData = ${JSON.stringify(svgData, null, 2)};

        function showOverlay(name, type) {
            const svg = svgData[name];
            if (svg) {
                document.getElementById('overlayIcon').innerHTML = svg;
                document.getElementById('overlayTitle').textContent = name;
                document.getElementById('overlayType').textContent = type;
                document.getElementById('overlay').style.display = 'flex';
            }
        }

        function hideOverlay() {
            document.getElementById('overlay').style.display = 'none';
        }

        // Close overlay with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideOverlay();
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
    </script>
</body>
</html>`;

  fs.writeFileSync("docs/index.html", htmlContent);
  console.log(`Documentation built with ${icons.length} icons`);
  console.log("Documentation available at: docs/index.html");
};

buildDocs().catch(console.error);
