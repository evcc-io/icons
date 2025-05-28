<template>
  <div
    v-if="!loading && !error"
    :class="`evcc-icon ${className}`"
    :style="combinedStyle"
    v-html="svgContent"
    :aria-label="`${type} ${name}`"
    role="img"
    v-bind="$attrs"
  />
  <span v-else-if="loading" :class="`evcc-icon-loading ${className}`"
    >Loading...</span
  >
  <span v-else :class="`evcc-icon-error ${className}`">{{ error }}</span>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  type: {
    type: String,
    required: true,
    validator: (value) => ["vehicle", "meter", "charger"].includes(value),
  },
  name: { type: String, required: true },
  accentColor: { type: String, default: "#4eb84b" },
  outlineColor: { type: String, default: "#000" },
  className: { type: String, default: "" },
  size: { type: [String, Number], default: null },
  width: { type: [String, Number], default: null },
  height: { type: [String, Number], default: null },
});

const svgContent = ref("");
const loading = ref(true);
const error = ref(null);

const combinedStyle = computed(() => {
  const style = {
    "--evcc-accent-color": props.accentColor,
    "--evcc-outline-color": props.outlineColor,
    display: "inline-block",
  };

  // Handle size prop (sets both width and height)
  if (props.size) {
    style.width =
      typeof props.size === "number" ? `${props.size}px` : props.size;
    style.height =
      typeof props.size === "number" ? `${props.size}px` : props.size;
  }

  // Handle individual width/height props
  if (props.width) {
    style.width =
      typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height =
      typeof props.height === "number" ? `${props.height}px` : props.height;
  }

  return style;
});

const loadSvg = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Import the SVG registry
    const { svgRegistry } = await import("./svg-registry.js");
    const key = `${props.type}/${props.name}`;
    const content = svgRegistry[key];

    if (content) {
      svgContent.value = content;
    } else {
      error.value = `Icon not found: ${key}`;
    }
  } catch (err) {
    error.value = `Failed to load icon: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

// Watch for changes in type or name and reload
watch(() => [props.type, props.name], loadSvg, { immediate: true });
</script>

<style scoped>
.evcc-icon {
  display: inline-block;
}

.evcc-icon-loading,
.evcc-icon-error {
  display: inline-block;
  font-size: 0.8em;
  color: #666;
}

.evcc-icon-error {
  color: #d32f2f;
}
</style>
