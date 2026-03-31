import * as z from "zod";
import { SentenceStructureDocumentSchema } from "../schema.js";
import {
  simplifiedSentenceStructureDocumentToSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "./simplified-codec.js";

export const jsonStringToSentenceStructureDocument = z.codec(
  z.string(),
  SentenceStructureDocumentSchema,
  {
    decode: (jsonString) =>
      simplifiedSentenceStructureDocumentToSentenceStructureDocument.decode(
        JSON.parse(jsonString) as SimplifiedSentenceStructureDocument,
      ),
    encode: (sentenceStructureDocument) =>
      JSON.stringify(
        simplifiedSentenceStructureDocumentToSentenceStructureDocument.encode(
          sentenceStructureDocument,
        ),
        null,
        2,
      ),
  },
);
