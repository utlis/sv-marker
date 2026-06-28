import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sentenceStructureDocumentToSimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import {
  geminiModelNameOptions,
  geminiThinkingLevelOptions,
  isValidGeminiParameters,
  promptReferenceDataOptions,
  retryCount,
  type GeminiModelName,
  type GeminiThinkingLevel,
  type PromptReferenceDataOption,
} from "./llm-parameters.js";
import type { Dataset, GeminiLog } from "./types.js";
import { generateSentenceStructureDocumentWithGemini } from "./generate-sentence-structure-document-with-gemini.js";

const args = process.argv.slice(2);
const promptReferenceDataOption = args
  .find((arg) => arg.startsWith("--prompt-reference-data="))
  ?.split("=")[1] as PromptReferenceDataOption | undefined;
if (
  !promptReferenceDataOption ||
  !promptReferenceDataOptions.includes(promptReferenceDataOption)
)
  throw new Error(
    "Please specify a valid prompt reference data option with --prompt-reference-data=",
  );
const modelName = args
  .find((arg) => arg.startsWith("--model="))
  ?.split("=")[1] as GeminiModelName | undefined;
if (!modelName || !geminiModelNameOptions.includes(modelName))
  throw new Error("Please specify a valid model name with --model=");
const thinkingLevel = args
  .find((arg) => arg.startsWith("--thinking-level="))
  ?.split("=")[1] as GeminiThinkingLevel | undefined;
if (!thinkingLevel || !geminiThinkingLevelOptions.includes(thinkingLevel))
  throw new Error(
    "Please specify a valid thinking level with --thinking-level=",
  );
if (!isValidGeminiParameters(modelName, thinkingLevel)) {
  throw new Error(
    "The specified combination of model and thinkingLevel is not valid.",
  );
}

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

// Warm up
await generateSentenceStructureDocumentWithGemini(
  "The quick brown fox jumps over the lazy dog.",
  {
    modelName,
    seed: 0,
    thinkingLevel,
  },
  {
    includeStanzaParseResult:
      promptReferenceDataOption === "raw-stanza-parse-result",
    includeSentenceStructureAnnotationsOutput:
      promptReferenceDataOption ===
      "draft-sentence-structure-annotations-output",
  },
);

const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${modelName}-${thinkingLevel.toLowerCase()}`;
if (!existsSync(directoryPath)) {
  mkdirSync(directoryPath, { recursive: true });
}

for (const dataset of datasets) {
  const logs: GeminiLog[] = existsSync(`${directoryPath}/logs.json`)
    ? JSON.parse(readFileSync(`${directoryPath}/logs.json`, "utf-8"))
    : [];

  while (
    (() => {
      const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
      if (!log) {
        return true;
      }
      return (
        log.retries.length < retryCount &&
        !log.retries.some((retry) => retry.success)
      );
    })()
  ) {
    const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
    const result = await generateSentenceStructureDocumentWithGemini(
      dataset.englishText,
      {
        modelName,
        seed: retryCount,
        thinkingLevel,
      },
      {
        includeStanzaParseResult:
          promptReferenceDataOption === "raw-stanza-parse-result",
        includeSentenceStructureAnnotationsOutput:
          promptReferenceDataOption ===
          "draft-sentence-structure-annotations-output",
      },
    );

    if (result.success) {
      if (log) {
        log.retries.push({
          processingTime: result.processingTime,
          rawResponse: result.rawResponse,
          success: true,
          simplifiedSentenceStructureDocument:
            sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
              result.sentenceStructureDocument,
            ),
        });
      } else {
        logs.push({
          datasetId: dataset.id,
          englishText: dataset.englishText,
          prompt: result.prompt,
          retries: [
            {
              processingTime: result.processingTime,
              rawResponse: result.rawResponse,
              success: true,
              simplifiedSentenceStructureDocument:
                sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
                  result.sentenceStructureDocument,
                ),
            },
          ],
        });
      }

      console.log(
        `[model: ${modelName}, thinkingLevel: ${thinkingLevel}] Processed dataset ID ${dataset.id} successfully.`,
      );
    } else {
      if (log) {
        log.retries.push({
          processingTime: result.processingTime,
          rawResponse: result.rawResponse,
          success: false,
          errorMessage: result.errorMessage,
        });
      } else {
        logs.push({
          datasetId: dataset.id,
          englishText: dataset.englishText,
          prompt: result.prompt,
          retries: [
            {
              processingTime: result.processingTime,
              rawResponse: result.rawResponse,
              success: false,
              errorMessage: result.errorMessage,
            },
          ],
        });
      }

      console.log(
        `[model: ${modelName}, thinkingLevel: ${thinkingLevel}] Failed to process dataset ID ${dataset.id}.`,
      );
    }
  }

  writeFileSync(`${directoryPath}/logs.json`, JSON.stringify(logs, null, 2));
}
