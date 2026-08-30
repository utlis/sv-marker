import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaParsedDocument } from "@sv-marker/sentence-structure-document-from-stanza";
import {
  parseDocument,
  type StanzaParsedDocument,
} from "./generated/stanza-server/client.js";

export async function generateSentenceStructureDocumentWithStanza(
  text: string,
): Promise<
  {
    processingTime: number;
    rawResponse: StanzaParsedDocument;
  } & (
    | {
        success: true;
        sentenceStructureDocument: SentenceStructureDocument;
      }
    | {
        success: false;
        errorMessage: string;
      }
  )
> {
  const startTime = Date.now();
  const response = await parseDocument({ text });
  const endTime = Date.now();
  if (response.status !== 200) {
    throw new Error("Failed to generate Stanza document.");
  }

  try {
    const sentenceStructureDocument =
      createSentenceStructureDocumentFromStanzaParsedDocument(response.data);

    return {
      processingTime: endTime - startTime,
      rawResponse: response.data,
      success: true,
      sentenceStructureDocument,
    };
  } catch (error) {
    return {
      processingTime: endTime - startTime,
      rawResponse: response.data,
      success: false,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
}
