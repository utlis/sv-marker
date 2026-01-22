import type { SentenceStructureDiagramNotation } from "../schema.js";
import { originalLayoutAnnotationPreset } from "./original-layout-annotation.js";
import { reflowLayoutAnnotationPreset } from "./reflow-layout-annotation.js";

export const presets = {
  "original-layout-annotation": originalLayoutAnnotationPreset,
  "reflow-layout-annotation": reflowLayoutAnnotationPreset,
} as const satisfies Record<string, SentenceStructureDiagramNotation>;
