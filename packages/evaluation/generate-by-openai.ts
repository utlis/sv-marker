import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { sentenceStructureDataToString } from "@sentence-structure-diagram-app/sentence-structure-data";
import { defaultConfigurations } from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import { generateSvgString } from "@sentence-structure-diagram-app/sentence-structure-diagram-svg";
import {
  isValidOpenAIParameters,
  openAIModelNames,
  openAIReasoningEffortValues,
  openAIVerbosityValues,
  retryCount,
  runCount,
  type Dataset,
  type OpenAILog,
  type OpenAIModelName,
  type OpenAIReasoningEffort,
  type OpenAIVerbosity,
} from "./llmConfigurations.js";
import { generateSentenceStructureDataByOpenAI } from "./generate-sentence-structure-data-by-openai.js";

const args = process.argv.slice(2);
const modelName = args
  .find((arg) => arg.startsWith("--model="))
  ?.split("=")[1] as OpenAIModelName | undefined;
if (!modelName || !openAIModelNames.includes(modelName))
  throw new Error("Please specify a valid model name with --model=");

type RunConfiguration = {
  modelName: OpenAIModelName;
  reasoningEffort: OpenAIReasoningEffort;
  verbosity: OpenAIVerbosity;
  runIndex: number;
};

const runConfigurations: RunConfiguration[] =
  openAIReasoningEffortValues.flatMap((reasoningEffort) =>
    openAIVerbosityValues.flatMap((verbosity) => {
      if (!isValidOpenAIParameters(modelName, reasoningEffort, verbosity))
        return [];
      return Array.from({ length: runCount }, (_, runIndex) => ({
        modelName,
        reasoningEffort,
        verbosity,
        runIndex,
      }));
    }),
  );

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

await Promise.all(
  runConfigurations.map(
    async ({ modelName, reasoningEffort, verbosity, runIndex }) => {
      const directoryPath = `${import.meta.dirname}/output/${modelName}-${reasoningEffort}-${verbosity}-${runIndex}`;
      if (!existsSync(directoryPath)) {
        mkdirSync(directoryPath, { recursive: true });
      }
      for (const dataset of datasets) {
        while (true) {
          const logs: OpenAILog[] = existsSync(`${directoryPath}/logs.json`)
            ? JSON.parse(readFileSync(`${directoryPath}/logs.json`, "utf-8"))
            : [];
          const log = logs.find((log) => log.id === dataset.id) ?? null;
          const retryIndex = log?.retries.length ?? 0;
          if (log?.success || retryCount <= retryIndex) break;

          const startTime = Date.now();
          const result = await generateSentenceStructureDataByOpenAI(
            dataset.englishText,
            {
              modelName,
              reasoningEffort,
              verbosity,
            },
          );
          const endTime = Date.now();

          if (result.success) {
            writeFileSync(
              `${directoryPath}/${dataset.id}.json`,
              sentenceStructureDataToString(result.sentenceStructureData),
            );
            writeFileSync(
              `${directoryPath}/${dataset.id}.svg`,
              generateSvgString(
                result.sentenceStructureData,
                1500,
                (text) => text.length * 8,
                defaultConfigurations,
              ),
            );

            const existingLog = logs.find((log) => log.id === dataset.id);
            if (existingLog) {
              existingLog.success = true;
              existingLog.retries.push({
                success: true,
                processingTime: endTime - startTime,
                rawResponse: result.rawResponse,
              });
            } else {
              logs.push({
                id: dataset.id,
                success: true,
                englishText: dataset.englishText,
                prompt: result.prompt,
                retries: [
                  {
                    success: true,
                    processingTime: endTime - startTime,
                    rawResponse: result.rawResponse,
                  },
                ],
              });
            }
            console.log(
              `[model: ${modelName}, reasoning.effort: ${reasoningEffort}, verbosity: ${verbosity}, run index: ${runIndex}] Processed dataset ID ${dataset.id} successfully.`,
            );
          } else {
            const existingLog = logs.find((log) => log.id === dataset.id);
            if (existingLog) {
              existingLog.retries.push({
                success: false,
                processingTime: endTime - startTime,
                rawResponse: result.rawResponse,
                errorMessage: result.errorMessage,
              });
            } else {
              logs.push({
                id: dataset.id,
                success: false,
                englishText: dataset.englishText,
                prompt: result.prompt,
                retries: [
                  {
                    success: false,
                    processingTime: endTime - startTime,
                    rawResponse: result.rawResponse,
                    errorMessage: result.errorMessage,
                  },
                ],
              });
            }
            console.log(
              `[model: ${modelName}, reasoning.effort: ${reasoningEffort}, verbosity: ${verbosity}, run index: ${runIndex}] Failed to process dataset ID ${dataset.id}. Retry index: ${retryIndex}.`,
            );
          }

          writeFileSync(
            `${directoryPath}/logs.json`,
            JSON.stringify(logs, null, 2),
          );
        }
      }
    },
  ),
);
