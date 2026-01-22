import {
  sentenceStructureDocumentToSentenceStructureDecoratedDocumentForest,
  type SentenceStructureDocument,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type { SentenceStructureDiagramNotation } from "@sentence-structure-diagram-app/sentence-structure-diagram-notation";
import { createSentenceStructureDiagramModelForest } from "./diagram-model/create.js";
import { createSentenceStructureDiagramLayoutTree } from "./diagram-layout/create.js";
import type { SentenceStructureDiagramData } from "./diagram-data/types.js";
import { createSentenceStructureDiagramData as _createSentenceStructureDiagramData } from "./diagram-data/create.js";
import { createSentenceStructureDiagramSVGString as _createSentenceStructureDiagramSVGString } from "./diagram-svg/create.js";

export function createSentenceStructureDiagramData(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  measureTextWidth: (text: string, fontSize: number) => number,
): SentenceStructureDiagramData {
  return _createSentenceStructureDiagramData(
    createSentenceStructureDiagramLayoutTree(
      createSentenceStructureDiagramModelForest(
        sentenceStructureDocumentToSentenceStructureDecoratedDocumentForest(
          sentenceStructureDocument,
        ),
        sentenceStructureDiagramNotation,
      ),
      measureTextWidth,
    ),
  );
}

export function createSentenceStructureDiagramSvgString(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  measureTextWidth: (text: string, fontSize: number) => number,
): string {
  return _createSentenceStructureDiagramSVGString(
    sentenceStructureDocument,
    sentenceStructureDiagramNotation,
    createSentenceStructureDiagramData(
      sentenceStructureDocument,
      sentenceStructureDiagramNotation,
      measureTextWidth,
    ),
  );
}
