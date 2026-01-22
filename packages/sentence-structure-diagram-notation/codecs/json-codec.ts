import * as z from "zod";
import { SentenceStructureDiagramNotationSchema } from "../schema.js";

export const jsonStringToSentenceStructureDiagramNotation = z.codec(
  z.string(),
  SentenceStructureDiagramNotationSchema,
  {
    decode: (jsonString) => JSON.parse(jsonString),
    encode: (sentenceStructureDiagramNotation) =>
      JSON.stringify(sentenceStructureDiagramNotation, null, 2),
  },
);
