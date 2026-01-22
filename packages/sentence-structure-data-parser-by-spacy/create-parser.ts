import type { SentenceStructureData } from "@sentence-structure-diagram-app/sentence-structure-data";
import { createSpacyParser } from "./spacy-parser.js";
import { spacyParseResultToSentenceStructureData } from "./spacy-parse-result-to-sentence-structure-data.js";

type SentenceStructureDataParser = {
  parse: (text: string) => SentenceStructureData;
};

export async function createSentenceStructureDataParser(
  resolveWheelURL: (wheelFileName: string) => URL,
  options?: {
    indexURL?: string;
  },
): Promise<SentenceStructureDataParser> {
  const dependencyParser = await createSpacyParser(resolveWheelURL, options);

  return {
    parse: (text: string) =>
      spacyParseResultToSentenceStructureData(dependencyParser.parse(text)),
  };
}
