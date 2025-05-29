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

<script setup lang="ts">
import { computed, ref, watch } from "vue";

export type IconType = "vehicle" | "meter" | "charger";

export interface EvccIconProps {
  type: IconType;
  name: string;
  accentColor?: string;
  outlineColor?: string;
  className?: string;
  size?: string | number;
  width?: string | number;
  height?: string | number;
}

const props = withDefaults(defineProps<EvccIconProps>(), {
  accentColor: "#4eb84b",
  outlineColor: "#000",
  className: "",
  size: undefined,
  width: undefined,
  height: undefined,
});

const svgContent = ref<string>("");
const loading = ref<boolean>(true);
const error = ref<string | null>(null);

const combinedStyle = computed(() => {
  const style: Record<string, string> = {
    "--evcc-accent-color": props.accentColor,
    "--evcc-outline-color": props.outlineColor,
    display: "inline-block",
  };

  // Handle size prop (sets both width and height)
  if (props.size) {
    const sizeValue = typeof props.size === "number" ? `${props.size}px` : props.size;
    style.width = sizeValue;
    style.height = sizeValue;
  }

  // Handle individual width/height props
  if (props.width) {
    style.width = typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === "number" ? `${props.height}px` : props.height;
  }

  return style;
});

const loadSvg = async (): Promise<void> => {
  try {
    loading.value = true;
    error.value = null;

    // Import the local SVG registry
    const { svgRegistry } = await import("./svg-registry.js");
    const key = `${props.type}/${props.name}`;
    const content = svgRegistry[key];

    if (content) {
      svgContent.value = content;
    } else {
      error.value = `Icon not found: ${key}`;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    error.value = `Failed to load icon: ${errorMessage}`;
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
