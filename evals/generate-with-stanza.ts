import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sentenceStructureDocumentToSimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import type { Dataset, StanzaLog } from "./types.js";
import { generateSentenceStructureDocumentWithStanza } from "./generate-sentence-structure-document-with-stanza.js";

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

// Warm up
await generateSentenceStructureDocumentWithStanza(
  "The quick brown fox jumps over the lazy dog.",
);

const directoryPath = `${import.meta.dirname}/output/stanza`;
if (!existsSync(directoryPath)) {
  mkdirSync(directoryPath, { recursive: true });
}

for (const dataset of datasets) {
  const logs: StanzaLog[] = existsSync(`${directoryPath}/logs.json`)
    ? JSON.parse(readFileSync(`${directoryPath}/logs.json`, "utf-8"))
    : [];
  if (logs.find((log) => log.datasetId === dataset.id)) {
    continue;
  }

  const result = await generateSentenceStructureDocumentWithStanza(
    dataset.englishText,
  );

  if (result.success) {
    logs.push({
      datasetId: dataset.id,
      englishText: dataset.englishText,
      processingTime: result.processingTime,
      rawResponse: result.rawResponse,
      success: true,
      simplifiedSentenceStructureDocument:
        sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
          result.sentenceStructureDocument,
        ),
    });

    console.log(`Processed dataset ID ${dataset.id} successfully.`);
  } else {
    logs.push({
      datasetId: dataset.id,
      englishText: dataset.englishText,
      processingTime: result.processingTime,
      rawResponse: result.rawResponse,
      success: false,
      errorMessage: result.errorMessage,
    });

    console.log(`Failed to process dataset ID ${dataset.id}.`);
  }

  writeFileSync(`${directoryPath}/logs.json`, JSON.stringify(logs, null, 2));
}
