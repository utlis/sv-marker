import {
  createSentenceStructureDocumentFromXMLString,
  sentenceStructureDocumentToSentenceStructureDecoratedDocumentForest,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import type { SentenceStructureDiagramNotation } from "@sv-marker/sentence-structure-diagram-notation";
import { createSentenceStructureDiagramModelForest } from "./diagram-model/create.js";
import { createSentenceStructureDiagramLayoutTree } from "./diagram-layout/create.js";
import type { SentenceStructureDiagramData } from "./diagram-data/types.js";
import { createSentenceStructureDiagramData as _createSentenceStructureDiagramData } from "./diagram-data/create.js";
import { createSentenceStructureDiagramSVGString as _createSentenceStructureDiagramSVGString } from "./diagram-svg/create.js";

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

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

export function createSentenceStructureDiagramSVGString(
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

export function createSentenceStructureDocumentFromSentenceStructureDiagramSVGString(
  svgString: string,
): Result<{ sentenceStructureDocument: SentenceStructureDocument }> {
  const sentenceStructureDocumentXMLString =
    svgString.match(
      /<sentence-structure-document.*?<\/sentence-structure-document>/s,
    )?.[0] ?? null;

  if (!sentenceStructureDocumentXMLString) {
    return {
      success: false,
      message: "フォーマットが正しくありません。",
    };
  }

  const result = createSentenceStructureDocumentFromXMLString(
    sentenceStructureDocumentXMLString,
  );

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      sentenceStructureDocument: result.data.newSentenceStructureDocument,
    },
  };
}
