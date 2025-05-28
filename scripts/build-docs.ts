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

	// Generate HTML documentation
	const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>EVCC Icons Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .icon-section {
            margin-bottom: 3rem;
        }
        .icon-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .icon-card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            transition: box-shadow 0.2s;
        }
        .icon-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .icon-display {
            width: 64px;
            height: 64px;
            margin: 0 auto 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .icon-display svg {
            max-width: 100%;
            max-height: 100%;
        }
        .icon-name {
            font-size: 0.9rem;
            color: #666;
            word-break: break-all;
        }
        .copy-btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            cursor: pointer;
            margin-top: 0.5rem;
        }
        .copy-btn:hover {
            background: #0056b3;
        }
        .search-box {
            width: 100%;
            max-width: 400px;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            margin: 0 auto 2rem;
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>EVCC Icons</h1>
        <p>A collection of icons for electric vehicle charging infrastructure</p>
        <input type="text" class="search-box" placeholder="Search icons..." id="searchBox">
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
            <div class="icon-card" data-name="${icon.name}">
                <div class="icon-display">
                    ${icon.svg}
                </div>
                <div class="icon-name">${icon.name}</div>
                <button class="copy-btn" onclick="copyToClipboard('${icon.svg.replace(
									/'/g,
									"\\'",
								)}')">
                    Copy SVG
                </button>
            </div>
            `,
							)
							.join("")}
        </div>
    </div>
    `,
			)
			.join("")}

    <script>
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                // Could add a toast notification here
                console.log('SVG copied to clipboard');
            });
        }

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
