import { renderToStaticMarkup } from "react-dom/server";
import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import type { SentenceStructureDiagramNotation } from "@sv-marker/sentence-structure-diagram-notation";
import type { SentenceStructureDiagramData } from "../diagram-data/types.js";
import SentenceStructureDiagram from "./SentenceStructureDiagram.js";

export function createSentenceStructureDiagramSVGString(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  sentenceStructureDiagramData: SentenceStructureDiagramData,
): string {
  return renderToStaticMarkup(
    SentenceStructureDiagram({
      sentenceStructureDocument: sentenceStructureDocument,
      sentenceStructureDiagramNotation,
      sentenceStructureDiagramData,
    }),
  );
}
