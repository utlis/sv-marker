import { parseDocument } from "./generated/stanza-server/client.js";
import {
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaParsedDocument } from "@sv-marker/sentence-structure-document-from-stanza";

export async function generateSimplifiedSentenceStructureDocumentWithStanza(
  text: string,
): Promise<SimplifiedSentenceStructureDocument> {
  const response = await parseDocument({ text });

  if (response.status !== 200) {
    throw new Error("Failed to parse sentence structure document.");
  }

  const sentenceStructureDocument =
    createSentenceStructureDocumentFromStanzaParsedDocument(response.data);

  return sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
    sentenceStructureDocument,
  );
}
