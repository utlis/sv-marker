import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sentenceStructureDocumentToSimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import {
  isValidOpenAIParameters,
  openAIModelNameOptions,
  openAIReasoningEffortOptions,
  promptReferenceDataOptions,
  retryCount,
  type OpenAIModelName,
  type OpenAIReasoningEffort,
  type PromptReferenceDataOption,
} from "./llm-parameters.js";
import type { Dataset, OpenAILog } from "./types.js";
import { generateSentenceStructureDocumentWithOpenAI } from "./generate-sentence-structure-document-with-openai.js";

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
  ?.split("=")[1] as OpenAIModelName | undefined;
if (!modelName || !openAIModelNameOptions.includes(modelName))
  throw new Error("Please specify a valid model name with --model=");
const reasoningEffort = args
  .find((arg) => arg.startsWith("--reasoning-effort="))
  ?.split("=")[1] as OpenAIReasoningEffort | undefined;
if (!reasoningEffort || !openAIReasoningEffortOptions.includes(reasoningEffort))
  throw new Error(
    "Please specify a valid reasoning effort with --reasoning-effort=",
  );
if (!isValidOpenAIParameters(modelName, reasoningEffort)) {
  throw new Error(
    "The specified combination of model and reasoning.effort is not valid.",
  );
}

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

// Warm up
await generateSentenceStructureDocumentWithOpenAI(
  "The quick brown fox jumps over the lazy dog.",
  {
    modelName,
    reasoningEffort,
  },
  {
    includeStanzaParseResult:
      promptReferenceDataOption === "raw-stanza-parse-result",
    includeSentenceStructureAnnotationsOutput:
      promptReferenceDataOption ===
      "draft-sentence-structure-annotations-output",
  },
);

const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${modelName}-${reasoningEffort}`;
if (!existsSync(directoryPath)) {
  mkdirSync(directoryPath, { recursive: true });
}

for (const dataset of datasets) {
  const logs: OpenAILog[] = existsSync(`${directoryPath}/logs.json`)
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
    const result = await generateSentenceStructureDocumentWithOpenAI(
      dataset.englishText,
      {
        modelName,
        reasoningEffort,
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
        `[model: ${modelName}, reasoning.effort: ${reasoningEffort}] Processed dataset ID ${dataset.id} successfully.`,
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
        `[model: ${modelName}, reasoning.effort: ${reasoningEffort}] Failed to process dataset ID ${dataset.id}.`,
      );
    }
  }

  writeFileSync(`${directoryPath}/logs.json`, JSON.stringify(logs, null, 2));
}
