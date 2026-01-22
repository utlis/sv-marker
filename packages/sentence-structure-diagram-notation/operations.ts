import type { SentenceStructureDiagramNotation } from "./schema.js";
import { jsonStringToSentenceStructureDiagramNotation } from "./codecs/json-codec.js";
import { xmlStringToSentenceStructureDiagramNotation } from "./codecs/xml-codec.js";

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export function createSentenceStructureDiagramNotationFromJSONString(
  jsonString: string,
): Result<{
  newSentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
}> {
  const newSentenceStructureDiagramNotation =
    jsonStringToSentenceStructureDiagramNotation.safeDecode(jsonString);

  if (newSentenceStructureDiagramNotation.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDiagramNotation:
          newSentenceStructureDiagramNotation.data,
      },
    };
  }

  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function createSentenceStructureDiagramNotationFromXMLString(
  xmlString: string,
): Result<{
  newSentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
}> {
  const newSentenceStructureDiagramNotation =
    xmlStringToSentenceStructureDiagramNotation.safeDecode(xmlString);

  if (newSentenceStructureDiagramNotation.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDiagramNotation:
          newSentenceStructureDiagramNotation.data,
      },
    };
  }

  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function sentenceStructureDiagramNotationToJSONString(
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): string {
  return jsonStringToSentenceStructureDiagramNotation.encode(
    sentenceStructureDiagramNotation,
  );
}

export function sentenceStructureDiagramNotationToXMLString(
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): string {
  return xmlStringToSentenceStructureDiagramNotation.encode(
    sentenceStructureDiagramNotation,
  );
}
