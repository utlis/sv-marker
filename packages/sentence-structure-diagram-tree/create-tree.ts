import type { SentenceStructureTree } from "@sentence-structure-diagram-app/sentence-structure-tree";
import type { LayoutMode } from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import type { SentenceStructureDiagramTree } from "./types.js";
import { createStructuredSentenceStructureDiagramTree } from "./create-structured-sentence-structure-diagram-tree.js";
import { createLinearSentenceStructureDiagramTree } from "./create-linear-sentence-structure-diagram-tree.js";

export function createSentenceStructureDiagramTree(
  tree: SentenceStructureTree,
  maxWidth: number,
  measureTextWidth: (text: string) => number,
  layoutMode: LayoutMode,
): SentenceStructureDiagramTree {
  if (layoutMode === "structured") {
    return createStructuredSentenceStructureDiagramTree(
      tree,
      maxWidth,
      measureTextWidth,
    );
  } else {
    return createLinearSentenceStructureDiagramTree(
      tree,
      maxWidth,
      measureTextWidth,
    );
  }
}
