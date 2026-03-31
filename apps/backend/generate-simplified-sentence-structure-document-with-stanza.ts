import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import {
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaParsedDocument } from "@sv-marker/sentence-structure-document-from-stanza";

const client = createClient<paths>({
  baseUrl: process.env.STANZA_SERVER_ORIGIN ?? "",
});

export async function generateSimplifiedSentenceStructureDocumentWithStanza(
  text: string,
): Promise<SimplifiedSentenceStructureDocument> {
  try {
    const { data } = await client.POST("/parse", {
      body: {
        text,
      },
    });

    if (!data) {
      throw new Error("Failed to generate sentence structure document.");
    }

    return sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
      createSentenceStructureDocumentFromStanzaParsedDocument(data),
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
