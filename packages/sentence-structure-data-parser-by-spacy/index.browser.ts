import { createSentenceStructureDataParser as _createSentenceStructureDataParser } from "./create-parser.js";

export async function createSentenceStructureDataParser(indexURL: string) {
  return _createSentenceStructureDataParser(
    (wheelFileName: string) => new URL(wheelFileName, indexURL),
    {
      indexURL,
    },
  );
}
