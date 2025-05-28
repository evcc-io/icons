# evcc Icons

🖍️ Work in progress 🖍️

A collection of evcc icons for vehicles, meters, and chargers. Available as separate packages for React, Vue, and Web Components.

## 📖 Documentation

**[View all icons →](https://evcc-io.github.io/evcc-icons/)**

Browse the complete collection of icons with search functionality and click-to-copy SVG code.

## Packages

- **`@evcc/icons`** - Core SVG registry (framework-agnostic)
- **`@evcc/icons-react`** - React components
- **`@evcc/icons-vue`** - Vue components
- **`@evcc/icons-web`** - Web Components

## Installation

Choose the package for your framework:

```bash
# React
npm install @evcc/icons-react

# Vue
npm install @evcc/icons-vue

# Web Components
npm install @evcc/icons-web

# Core registry only (for custom implementations)
npm install @evcc/icons
```

## Features

- 🚗 **Vehicle icons** - Electric vehicles and their variants
- ⚡ **Charger icons** - Various charging station types
- 📊 **Meter icons** - Energy meters and monitoring devices
- 🎨 **Customizable colors** - Change accent and outline colors
- 📱 **Framework support** - React, Vue, and Web Components
- 🔧 **TypeScript support** - Full type definitions included
- ♿ **Accessible** - ARIA labels and semantic markup
- 📦 **No peer dependency conflicts** - Each framework has its own package

## Usage

### React

```jsx
import { EvccIcon } from "@evcc/icons-react";

function App() {
  return (
    <div>
      {/* Basic usage */}
      <EvccIcon type="vehicle" name="kia-niro-ev" />

      {/* Custom colors */}
      <EvccIcon
        type="vehicle"
        name="kia-niro-ev"
        accentColor="#ff6b35"
        outlineColor="#333"
      />

      {/* Custom size */}
      <EvccIcon type="vehicle" name="kia-niro-ev" size="64px" />

      {/* Individual width/height */}
      <EvccIcon type="vehicle" name="kia-niro-ev" width="100px" height="80px" />
    </div>
  );
}
```

### Vue

```vue
<template>
  <div>
    <!-- Basic usage -->
    <EvccIcon type="vehicle" name="kia-niro-ev" />

    <!-- Custom colors -->
    <EvccIcon
      type="vehicle"
      name="kia-niro-ev"
      accent-color="#ff6b35"
      outline-color="#333"
    />

    <!-- Custom size -->
    <EvccIcon type="vehicle" name="kia-niro-ev" :size="64" />
  </div>
</template>

<script setup>
import { EvccIcon } from "@evcc/icons-vue";
</script>
```

### Web Components

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module">
      import "@evcc/icons-web";
    </script>
  </head>
  <body>
    <!-- Basic usage -->
    <evcc-icon type="vehicle" name="kia-niro-ev"></evcc-icon>

    <!-- Custom colors -->
    <evcc-icon
      type="vehicle"
      name="kia-niro-ev"
      accent-color="#ff6b35"
      outline-color="#333"
    >
    </evcc-icon>

    <!-- Custom size -->
    <evcc-icon type="vehicle" name="kia-niro-ev" size="64px"> </evcc-icon>
  </body>
</html>
```

### Core Registry (Custom Implementation)

```javascript
import { svgRegistry, getIcon, getIconsByType } from "@evcc/icons";

// Get a specific icon
const iconSvg = getIcon("vehicle", "kia-niro-ev");

// Get all vehicle icons
const vehicleIcons = getIconsByType("vehicle");

// Access the full registry
console.log(svgRegistry);
```

## Props/Attributes

| Prop/Attribute                   | Type                                | Required | Default   | Description                            |
| -------------------------------- | ----------------------------------- | -------- | --------- | -------------------------------------- |
| `type`                           | `'vehicle' \| 'meter' \| 'charger'` | ✅       | -         | Icon category                          |
| `name`                           | `string`                            | ✅       | -         | Icon name (filename without extension) |
| `accentColor` / `accent-color`   | `string`                            | ❌       | `#4eb84b` | Color for accent elements              |
| `outlineColor` / `outline-color` | `string`                            | ❌       | `#000`    | Color for outlines and strokes         |
| `size`                           | `string \| number`                  | ❌       | -         | Sets both width and height             |
| `width`                          | `string \| number`                  | ❌       | -         | Icon width                             |
| `height`                         | `string \| number`                  | ❌       | -         | Icon height                            |
| `className` / `class`            | `string`                            | ❌       | -         | Additional CSS classes                 |

## Available Icons

### Vehicles

- `hyundai-inster` - Hyundai Inster
- `kia-ev9` - Kia EV9
- `kia-niro-ev` - Kia Niro EV

### Meters

- `e3dc-s10` - E3DC S10

### Chargers

- `easee-home` - Easee Home
- `keba-kecontact-p30` - KEBA KeContact P30

**[View all icons with visual preview →](https://evcc-io.github.io/evcc-icons/)**

## Color Customization

All icons use two main colors:

- **Accent Color** (default: `#4eb84b`) - Used for highlights and branded elements
- **Outline Color** (default: `#000`) - Used for outlines, strokes, and text

You can customize these colors using the `accentColor`/`accent-color` and `outlineColor`/`outline-color` props.

## TypeScript Support

All packages include full TypeScript definitions:

```typescript
// React
import { EvccIcon, EvccIconProps } from "@evcc/icons-react";

// Vue
import { EvccIcon } from "@evcc/icons-vue";

// Core registry
import { svgRegistry, getIcon } from "@evcc/icons";
```

## Contributing

1. Add your SVG files to the appropriate directory (`src/vehicles/`, `src/meters/`, or `src/chargers/`)
2. Ensure SVGs use the standard colors (`#4eb84b` for accent, `#000` for outline)
3. Run `npm run build` to generate the icon registry
4. Test with the examples

## Development

```bash
# Install dependencies
npm install

# Build the core package
npm run build

# Build all packages (if using monorepo setup)
npm run build:all

# Clean build artifacts
npm run clean
```

## Package Structure

```
@evcc/icons/                # Core SVG registry
├── dist/svg-registry.js    # Framework-agnostic
└── packages/
    ├── react/              # @evcc/icons-react
    ├── vue/                # @evcc/icons-vue
    └── web/                # @evcc/icons-web
```

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-nc-sa/4.0/).

### What this means:

- ✅ **Free for personal use** - Use in your personal projects
- ✅ **Free for open source** - Use in open source projects
- ✅ **Free for education** - Use in educational materials
- ❌ **No commercial use** - Cannot be used in commercial products or services
- 📝 **Attribution required** - Must credit "https://evcc.io"
- 🔄 **Share-alike** - Derivatives must use the same license

For commercial licensing options, please contact info@evcc.io.
