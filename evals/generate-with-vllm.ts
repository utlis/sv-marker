import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sentenceStructureDocumentToSimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import {
  gptOSSReasoningEffortOptions,
  promptReferenceDataOptions,
  retryCount,
  vllmModelNameOptions,
  type GPTOSSReasoningEffort,
  type PromptReferenceDataOption,
  type VLLMModelName,
} from "./llm-parameters.js";
import type { Dataset, VLLMLog } from "./types.js";
import { generateSentenceStructureDocumentWithVLLM } from "./generate-sentence-structure-document-with-vllm.js";

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
  ?.split("=")[1] as VLLMModelName | undefined;
if (!modelName || !vllmModelNameOptions.includes(modelName))
  throw new Error("Please specify a valid model name with --model=");
const enableThinking =
  args.find((arg) => arg.startsWith("--enable-thinking="))?.split("=")[1] ===
  "true"
    ? true
    : args
          .find((arg) => arg.startsWith("--enable-thinking="))
          ?.split("=")[1] === "false"
      ? false
      : undefined;
if (modelName !== "gpt-oss-20b" && enableThinking === undefined)
  throw new Error(
    "Please specify a valid enable-thinking value with --enable-thinking=",
  );
const reasoningEffort = args
  .find((arg) => arg.startsWith("--reasoning-effort="))
  ?.split("=")[1] as GPTOSSReasoningEffort | undefined;
if (
  modelName === "gpt-oss-20b" &&
  (!reasoningEffort || !gptOSSReasoningEffortOptions.includes(reasoningEffort))
)
  throw new Error(
    "Please specify a valid reasoning effort with --reasoning-effort=",
  );

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

// Warm up
await generateSentenceStructureDocumentWithVLLM(
  "The quick brown fox jumps over the lazy dog.",
  {
    model: modelName,
    seed: 0,
    enableThinking,
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

const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${modelName}-${reasoningEffort ? reasoningEffort : enableThinking}`;
if (!existsSync(directoryPath)) {
  mkdirSync(directoryPath, { recursive: true });
}

for (const dataset of datasets) {
  const logs: VLLMLog[] = existsSync(`${directoryPath}/logs.json`)
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
    const result = await generateSentenceStructureDocumentWithVLLM(
      dataset.englishText,
      {
        model: modelName,
        seed: retryCount,
        enableThinking,
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
        `[model: ${modelName}, ${reasoningEffort ? `reasoning.effort: ${reasoningEffort}` : `enable.thinking: ${enableThinking}`}] Processed dataset ID ${dataset.id} successfully.`,
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
        `[model: ${modelName}, ${reasoningEffort ? `reasoning.effort: ${reasoningEffort}` : `enable.thinking: ${enableThinking}`}] Failed to process dataset ID ${dataset.id}.`,
      );
    }
  }

  writeFileSync(`${directoryPath}/logs.json`, JSON.stringify(logs, null, 2));
}
