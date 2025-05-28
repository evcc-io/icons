# evcc Icons Documentation

This directory contains the GitHub Pages documentation for the evcc Icons project.

## Overview

The documentation provides a visual overview of all available icons organized by category:

- **Vehicles** - Electric vehicle icons
- **Chargers** - Charging station icons
- **Meters** - Energy meter icons

## Features

- **Visual Grid** - All icons displayed in an organized grid layout
- **Search** - Real-time search functionality to find specific icons
- **Modal View** - Click any icon to view it in a large overlay modal
- **Responsive Design** - Works on desktop and mobile devices
- **Dark Mode** - Automatic dark mode support based on system preferences
- **Statistics** - Shows total count of icons by category

## Build Process

The documentation is automatically generated from the SVG files in the `src/` directory:

1. **Manual Build**: Run `npm run build:docs` to generate the documentation
2. **Automatic Deployment**: GitHub Actions automatically rebuilds and deploys when:
   - New SVG files are added to `src/`
   - Documentation files are modified
   - The build script is updated

## File Structure

- `index.html` - Main documentation page (auto-generated)
- `README.md` - This documentation file

## Development

To update the documentation:

1. Add new SVG files to the appropriate `src/` subdirectory
2. Run `npm run build:docs` to regenerate the documentation
3. The GitHub Actions workflow will automatically deploy changes when pushed to the main branch

## Accessing the Documentation

Once deployed, the documentation will be available at:
`https://evcc-io.github.io/evcc-icons/`

## Technical Details

- The documentation uses vanilla JavaScript for interactivity
- SVG icons are embedded directly in the HTML for fast loading
- CSS custom properties are used for theming and color customization
- The build script processes SVGs to use CSS variables for consistent theming
