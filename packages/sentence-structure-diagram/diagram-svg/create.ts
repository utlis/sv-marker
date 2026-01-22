import { renderToStaticMarkup } from "react-dom/server";
import type { SentenceStructureDocument } from "@sentence-structure-diagram-app/sentence-structure-data";
import type { SentenceStructureDiagramNotation } from "@sentence-structure-diagram-app/sentence-structure-diagram-notation";
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
