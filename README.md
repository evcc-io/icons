# evcc Icons

A collection of evcc icons for vehicles, meters, and chargers. Available as web components with SVG registry for direct access.

## 📦 Installation

```bash
npm install @evcc/icons
```

## 🚀 Quick Start

### Web Components (Recommended)

```javascript
import '@evcc/icons';
```

```html
<!-- Simple usage -->
<evcc-icon type="vehicle" name="kia-niro-ev"></evcc-icon>

<!-- With custom colors and size -->
<evcc-icon 
  type="charger" 
  name="tesla-wallconnector" 
  size="48" 
  accent-color="#ff6b35">
</evcc-icon>
```

### Direct Registry Access

```javascript
import { registry } from '@evcc/icons';

// Load an icon manually
const iconLoader = registry['vehicle/kia-niro-ev'];
if (iconLoader) {
  const iconModule = await iconLoader();
  const svgString = iconModule.default;
  document.getElementById('my-icon').innerHTML = svgString;
}
```

## ✨ Features

- 🎨 **Customizable colors** - Accent and outline colors via CSS custom properties
- 📱 **Web Components** - Native custom elements with lazy loading
- 🔗 **Direct access** - SVG registry for custom implementations
- 🚀 **Performance** - Lazy loading and caching built-in
- 💪 **TypeScript** - Full type definitions included

### Web Component API

The `<evcc-icon>` web component supports the following attributes:

- `type` - Icon category: `vehicle`, `charger`, or `meter`
- `name` - Specific icon name (e.g., `kia-niro-ev`)
- `size` - Icon size in pixels or CSS units
- `accent-color` - Custom accent color (default: `#4eb84b`)
- `outline-color` - Custom outline color (default: `#000`)

Example with all options:

```html
<evcc-icon 
  type="vehicle" 
  name="bmw-i3" 
  size="64px"
  accent-color="#1976d2"
  outline-color="#333">
</evcc-icon>
```

### Registry API

```javascript
import { registry } from '@evcc/icons';

// Get all available icons
const availableIcons = Object.keys(registry);

// Load an icon
const iconLoader = registry['charger/tesla-wallconnector'];
const iconModule = await iconLoader();
const svgString = iconModule.default;
```

## 🎨 CSS Custom Properties

Icons use CSS custom properties for theming:

```css
evcc-icon {
  --evcc-accent-color: #ff6b35;
  --evcc-outline-color: #333;
}
```

## 📂 Available Icons

Icons are organized by category:

- **Vehicles** (`vehicle/`): Car models and EV brands
- **Chargers** (`charger/`): Charging stations and wallboxes  
- **Meters** (`meter/`): Energy meters and monitoring devices

See the [full icon gallery](https://evcc-io.github.io/icons/) for all available icons.

## 🔧 Development

```bash
git clone https://github.com/evcc-io/evcc-icons.git
cd evcc-icons
npm install
npm run build
npm run dev  # Serves docs at http://localhost:3000
```

## 📄 License

This project is licensed under the [CC-BY-NC-SA-4.0](LICENSE) license.
