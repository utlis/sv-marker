import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaParsedDocument } from "@sv-marker/sentence-structure-document-from-stanza";

const client = createClient<paths>({
  baseUrl: process.env.STANZA_SERVER_ORIGIN ?? "",
});

export async function generateSentenceStructureDocumentWithStanza(
  text: string,
): Promise<
  {
    processingTime: number;
    rawResponse: paths["/parse"]["post"]["responses"]["200"]["content"]["application/json"];
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
  const { data } = await client.POST("/parse", {
    body: {
      text,
    },
  });
  const endTime = Date.now();
  if (!data) {
    throw new Error("Failed to generate Stanza document");
  }

  try {
    const sentenceStructureDocument =
      createSentenceStructureDocumentFromStanzaParsedDocument(data);

    return {
      processingTime: endTime - startTime,
      rawResponse: data,
      success: true,
      sentenceStructureDocument,
    };
  } catch (error) {
    return {
      processingTime: endTime - startTime,
      rawResponse: data,
      success: false,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
}
