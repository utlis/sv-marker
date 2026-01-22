import { createSentenceStructureDataParser as _createSentenceStructureDataParser } from "./create-parser.js";

export async function createSentenceStructureDataParser() {
  return _createSentenceStructureDataParser(
    (wheelFileName: string) =>
      new URL(wheelFileName, new URL("./wheels/", import.meta.url)),
  );
}
