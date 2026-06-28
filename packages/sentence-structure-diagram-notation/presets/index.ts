import type { SentenceStructureDiagramNotation } from "../schema.js";
import { nonReflowAnnotationPreset } from "./non-reflow-annotation.js";
import { nonReflowDiagramPreset } from "./non-reflow-diagram.js";
import { reflowAnnotationPreset } from "./reflow-annotation.js";
import { reflowDiagramPreset } from "./reflow-diagram.js";

export const presets = {
  "non-reflow-annotation": nonReflowAnnotationPreset,
  "reflow-annotation": reflowAnnotationPreset,
  "non-reflow-diagram": nonReflowDiagramPreset,
  "reflow-diagram": reflowDiagramPreset,
} as const satisfies Record<string, SentenceStructureDiagramNotation>;
