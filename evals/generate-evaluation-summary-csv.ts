import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromSentenceStructureDiagramSVGString } from "@sv-marker/sentence-structure-diagram";
import type {
  Dataset,
  GeminiLog,
  OpenAILog,
  StanzaLog,
  VLLMLog,
} from "./types.js";
import {
  geminiModelNameOptions,
  geminiThinkingLevelOptions,
  gptOSSReasoningEffortOptions,
  isValidGeminiParameters,
  isValidOpenAIParameters,
  openAIModelNameOptions,
  openAIReasoningEffortOptions,
  promptReferenceDataOptions,
  vllmModelNameOptions,
} from "./llm-parameters.js";
import { calculateEvaluationSummary } from "./calculate-evaluation-summary.js";

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);

const answerSentenceStructureDocuments: SentenceStructureDocument[] =
  datasets.map((dataset) => {
    const result =
      createSentenceStructureDocumentFromSentenceStructureDiagramSVGString(
        readFileSync(`${import.meta.dirname}/data/${dataset.id}.svg`, "utf-8"),
      );
    if (!result.success) throw new Error("Failed to parse answer document");
    return result.data.sentenceStructureDocument;
  });

const headerRow = [
  "モデル名とパラメーター",
  "生成成功割合",
  "平均処理時間（s）",
  "文構造要素の正解数",
  "文構造要素の予測数",
  "文構造要素の一致数",
  "文構造要素のRecall",
  "文構造要素のPrecision",
  "文構造要素のF1",
  "修飾関係の正解数",
  "修飾関係の予測数",
  "修飾関係の一致数",
  "修飾関係のRecall",
  "修飾関係のPrecision",
  "修飾関係のF1",
  "並列関係の正解数",
  "並列関係の予測数",
  "並列関係の一致数",
  "並列関係のRecall",
  "並列関係のPrecision",
  "並列関係のF1",
];

const evaluationSummaryCSV: string[][] = [headerRow];

{
  const directoryPath = `${import.meta.dirname}/output/stanza`;
  const predictionSentenceStructureDocuments: (SentenceStructureDocument | null)[] =
    datasets.map((dataset) => {
      if (!existsSync(`${directoryPath}/logs.json`)) {
        return null;
      }
      const logs: StanzaLog[] = JSON.parse(
        readFileSync(`${directoryPath}/logs.json`, "utf-8"),
      );
      const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
      if (!log || !log.success) {
        return null;
      }

      return createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
        log.simplifiedSentenceStructureDocument,
      );
    });
  const answerPredictionPairs = datasets.map((_, index) => ({
    answer: answerSentenceStructureDocuments.at(index)!,
    prediction: predictionSentenceStructureDocuments.at(index) ?? null,
  }));
  const evaluationSummary = calculateEvaluationSummary(answerPredictionPairs);

  const averageProcessingTime = (() => {
    if (!existsSync(`${directoryPath}/logs.json`)) {
      return NaN;
    }
    const logs: StanzaLog[] = JSON.parse(
      readFileSync(`${directoryPath}/logs.json`, "utf-8"),
    );
    const processingTimes = logs
      .filter((log) => log.success)
      .map((log) => log.processingTime);

    return (
      processingTimes.reduce((sum, processingTime) => sum + processingTime, 0) /
      processingTimes.length
    );
  })();

  evaluationSummaryCSV.push([
    `Stanza`,
    evaluationSummary.generationRate.toFixed(3),
    (averageProcessingTime / 1000).toFixed(1),
    evaluationSummary.sentenceStructureElement.answerCount.toString(),
    evaluationSummary.sentenceStructureElement.predictionCount.toString(),
    evaluationSummary.sentenceStructureElement.correctCount.toString(),
    evaluationSummary.sentenceStructureElement.recall.toFixed(3),
    evaluationSummary.sentenceStructureElement.precision.toFixed(3),
    evaluationSummary.sentenceStructureElement.f1Score.toFixed(3),
    evaluationSummary.modification.answerCount.toString(),
    evaluationSummary.modification.predictionCount.toString(),
    evaluationSummary.modification.correctCount.toString(),
    evaluationSummary.modification.recall.toFixed(3),
    evaluationSummary.modification.precision.toFixed(3),
    evaluationSummary.modification.f1Score.toFixed(3),
    evaluationSummary.coordination.answerCount.toString(),
    evaluationSummary.coordination.predictionCount.toString(),
    evaluationSummary.coordination.correctCount.toString(),
    evaluationSummary.coordination.recall.toFixed(3),
    evaluationSummary.coordination.precision.toFixed(3),
    evaluationSummary.coordination.f1Score.toFixed(3),
  ]);
}

for (const openAIModelNameOption of openAIModelNameOptions) {
  for (const openAIReasoningEffortOption of openAIReasoningEffortOptions) {
    for (const promptReferenceDataOption of promptReferenceDataOptions) {
      if (
        !isValidOpenAIParameters(
          openAIModelNameOption,
          openAIReasoningEffortOption,
        )
      ) {
        continue;
      }

      const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${openAIModelNameOption}-${openAIReasoningEffortOption.toLowerCase()}`;
      const predictionSentenceStructureDocuments: (SentenceStructureDocument | null)[] =
        datasets.map((dataset) => {
          if (!existsSync(`${directoryPath}/logs.json`)) {
            return null;
          }
          const logs: OpenAILog[] = JSON.parse(
            readFileSync(`${directoryPath}/logs.json`, "utf-8"),
          );
          const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
          if (!log) {
            return null;
          }
          const lastRetry = log.retries.at(-1) ?? null;
          if (!lastRetry || !lastRetry.success) {
            return null;
          }

          return createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
            lastRetry.simplifiedSentenceStructureDocument,
          );
        });
      const answerPredictionPairs = datasets.map((_, index) => ({
        answer: answerSentenceStructureDocuments.at(index)!,
        prediction: predictionSentenceStructureDocuments.at(index) ?? null,
      }));
      const evaluationSummary = calculateEvaluationSummary(
        answerPredictionPairs,
      );

      const averageProcessingTime = (() => {
        if (!existsSync(`${directoryPath}/logs.json`)) {
          return NaN;
        }
        const logs: OpenAILog[] = JSON.parse(
          readFileSync(`${directoryPath}/logs.json`, "utf-8"),
        );
        const processingTimes = logs
          .filter((log) => log.retries.at(-1)!.success)
          .map((log) => log.retries.at(-1)!.processingTime);

        return (
          processingTimes.reduce(
            (sum, processingTime) => sum + processingTime,
            0,
          ) / processingTimes.length
        );
      })();

      evaluationSummaryCSV.push([
        `${openAIModelNameOption} reasoning.effort=${openAIReasoningEffortOption}${(() => {
          switch (promptReferenceDataOption) {
            case "none": {
              return "";
            }
            case "raw-stanza-parse-result": {
              return " Stanzaの解析結果付き";
            }
            case "draft-sentence-structure-annotations-output": {
              return " 出力JSONの下書き付き";
            }
          }
        })()}`,
        evaluationSummary.generationRate.toFixed(3),
        (averageProcessingTime / 1000).toFixed(1),
        evaluationSummary.sentenceStructureElement.answerCount.toString(),
        evaluationSummary.sentenceStructureElement.predictionCount.toString(),
        evaluationSummary.sentenceStructureElement.correctCount.toString(),
        evaluationSummary.sentenceStructureElement.recall.toFixed(3),
        evaluationSummary.sentenceStructureElement.precision.toFixed(3),
        evaluationSummary.sentenceStructureElement.f1Score.toFixed(3),
        evaluationSummary.modification.answerCount.toString(),
        evaluationSummary.modification.predictionCount.toString(),
        evaluationSummary.modification.correctCount.toString(),
        evaluationSummary.modification.recall.toFixed(3),
        evaluationSummary.modification.precision.toFixed(3),
        evaluationSummary.modification.f1Score.toFixed(3),
        evaluationSummary.coordination.answerCount.toString(),
        evaluationSummary.coordination.predictionCount.toString(),
        evaluationSummary.coordination.correctCount.toString(),
        evaluationSummary.coordination.recall.toFixed(3),
        evaluationSummary.coordination.precision.toFixed(3),
        evaluationSummary.coordination.f1Score.toFixed(3),
      ]);
    }
  }
}

for (const geminiModelNameOption of geminiModelNameOptions) {
  for (const geminiThinkingLevelOption of geminiThinkingLevelOptions) {
    for (const promptReferenceDataOption of promptReferenceDataOptions) {
      if (
        !isValidGeminiParameters(
          geminiModelNameOption,
          geminiThinkingLevelOption,
        )
      ) {
        continue;
      }

      const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${geminiModelNameOption}-${geminiThinkingLevelOption.toLowerCase()}`;
      const predictionSentenceStructureDocuments: (SentenceStructureDocument | null)[] =
        datasets.map((dataset) => {
          if (!existsSync(`${directoryPath}/logs.json`)) {
            return null;
          }
          const logs: GeminiLog[] = JSON.parse(
            readFileSync(`${directoryPath}/logs.json`, "utf-8"),
          );
          const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
          if (!log) {
            return null;
          }
          const lastRetry = log.retries.at(-1) ?? null;
          if (!lastRetry || !lastRetry.success) {
            return null;
          }

          return createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
            lastRetry.simplifiedSentenceStructureDocument,
          );
        });
      const answerPredictionPairs = datasets.map((_, index) => ({
        answer: answerSentenceStructureDocuments.at(index)!,
        prediction: predictionSentenceStructureDocuments.at(index) ?? null,
      }));
      const evaluationSummary = calculateEvaluationSummary(
        answerPredictionPairs,
      );

      const averageProcessingTime = (() => {
        if (!existsSync(`${directoryPath}/logs.json`)) {
          return NaN;
        }
        const logs: GeminiLog[] = JSON.parse(
          readFileSync(`${directoryPath}/logs.json`, "utf-8"),
        );
        const processingTimes = logs
          .filter((log) => log.retries.at(-1)!.success)
          .map((log) => log.retries.at(-1)!.processingTime);

        return (
          processingTimes.reduce(
            (sum, processingTime) => sum + processingTime,
            0,
          ) / processingTimes.length
        );
      })();

      evaluationSummaryCSV.push([
        `${geminiModelNameOption} thinkingLevel=${geminiThinkingLevelOption}${(() => {
          switch (promptReferenceDataOption) {
            case "none": {
              return "";
            }
            case "raw-stanza-parse-result": {
              return " Stanzaの解析結果付き";
            }
            case "draft-sentence-structure-annotations-output": {
              return " 出力JSONの下書き付き";
            }
          }
        })()}`,
        evaluationSummary.generationRate.toFixed(3),
        (averageProcessingTime / 1000).toFixed(1),
        evaluationSummary.sentenceStructureElement.answerCount.toString(),
        evaluationSummary.sentenceStructureElement.predictionCount.toString(),
        evaluationSummary.sentenceStructureElement.correctCount.toString(),
        evaluationSummary.sentenceStructureElement.recall.toFixed(3),
        evaluationSummary.sentenceStructureElement.precision.toFixed(3),
        evaluationSummary.sentenceStructureElement.f1Score.toFixed(3),
        evaluationSummary.modification.answerCount.toString(),
        evaluationSummary.modification.predictionCount.toString(),
        evaluationSummary.modification.correctCount.toString(),
        evaluationSummary.modification.recall.toFixed(3),
        evaluationSummary.modification.precision.toFixed(3),
        evaluationSummary.modification.f1Score.toFixed(3),
        evaluationSummary.coordination.answerCount.toString(),
        evaluationSummary.coordination.predictionCount.toString(),
        evaluationSummary.coordination.correctCount.toString(),
        evaluationSummary.coordination.recall.toFixed(3),
        evaluationSummary.coordination.precision.toFixed(3),
        evaluationSummary.coordination.f1Score.toFixed(3),
      ]);
    }
  }
}

for (const vllmModelNameOption of vllmModelNameOptions) {
  const thinkingOptions = (() => {
    switch (vllmModelNameOption) {
      case "Qwen3.6-27B": {
        return [true, false];
      }
      case "gemma-4-31B-it": {
        return [true, false];
      }
      case "gpt-oss-20b": {
        return gptOSSReasoningEffortOptions;
      }
      default: {
        vllmModelNameOption satisfies never;
        throw new Error("Unreachable");
      }
    }
  })();
  for (const thinkingOption of thinkingOptions) {
    for (const promptReferenceDataOption of promptReferenceDataOptions) {
      const directoryPath = `${import.meta.dirname}/output/${promptReferenceDataOption}-${vllmModelNameOption}-${thinkingOption}`;
      const predictionSentenceStructureDocuments: (SentenceStructureDocument | null)[] =
        datasets.map((dataset) => {
          if (!existsSync(`${directoryPath}/logs.json`)) {
            return null;
          }
          const logs: VLLMLog[] = JSON.parse(
            readFileSync(`${directoryPath}/logs.json`, "utf-8"),
          );
          const log = logs.find((log) => log.datasetId === dataset.id) ?? null;
          if (!log) {
            return null;
          }
          const lastRetry = log.retries.at(-1) ?? null;
          if (!lastRetry || !lastRetry.success) {
            return null;
          }

          return createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
            lastRetry.simplifiedSentenceStructureDocument,
          );
        });
      const answerPredictionPairs = datasets.map((_, index) => ({
        answer: answerSentenceStructureDocuments.at(index)!,
        prediction: predictionSentenceStructureDocuments.at(index) ?? null,
      }));
      const evaluationSummary = calculateEvaluationSummary(
        answerPredictionPairs,
      );

      const averageProcessingTime = (() => {
        if (!existsSync(`${directoryPath}/logs.json`)) {
          return NaN;
        }
        const logs: VLLMLog[] = JSON.parse(
          readFileSync(`${directoryPath}/logs.json`, "utf-8"),
        );
        const processingTimes = logs
          .filter((log) => log.retries.at(-1)!.success)
          .map((log) => log.retries.at(-1)!.processingTime);

        return (
          processingTimes.reduce(
            (sum, processingTime) => sum + processingTime,
            0,
          ) / processingTimes.length
        );
      })();

      evaluationSummaryCSV.push([
        `${vllmModelNameOption} ${(() => {
          switch (vllmModelNameOption) {
            case "Qwen3.6-27B":
            case "gemma-4-31B-it": {
              return `enableThinking=${thinkingOption}`;
            }
            case "gpt-oss-20b": {
              return `reasoningEffort=${thinkingOption}`;
            }
            default: {
              vllmModelNameOption satisfies never;
              throw new Error("Unreachable");
            }
          }
        })()}${(() => {
          switch (promptReferenceDataOption) {
            case "none": {
              return "";
            }
            case "raw-stanza-parse-result": {
              return " Stanzaの解析結果付き";
            }
            case "draft-sentence-structure-annotations-output": {
              return " 出力JSONの下書き付き";
            }
          }
        })()}`,
        evaluationSummary.generationRate.toFixed(3),
        (averageProcessingTime / 1000).toFixed(1),
        evaluationSummary.sentenceStructureElement.answerCount.toString(),
        evaluationSummary.sentenceStructureElement.predictionCount.toString(),
        evaluationSummary.sentenceStructureElement.correctCount.toString(),
        evaluationSummary.sentenceStructureElement.recall.toFixed(3),
        evaluationSummary.sentenceStructureElement.precision.toFixed(3),
        evaluationSummary.sentenceStructureElement.f1Score.toFixed(3),
        evaluationSummary.modification.answerCount.toString(),
        evaluationSummary.modification.predictionCount.toString(),
        evaluationSummary.modification.correctCount.toString(),
        evaluationSummary.modification.recall.toFixed(3),
        evaluationSummary.modification.precision.toFixed(3),
        evaluationSummary.modification.f1Score.toFixed(3),
        evaluationSummary.coordination.answerCount.toString(),
        evaluationSummary.coordination.predictionCount.toString(),
        evaluationSummary.coordination.correctCount.toString(),
        evaluationSummary.coordination.recall.toFixed(3),
        evaluationSummary.coordination.precision.toFixed(3),
        evaluationSummary.coordination.f1Score.toFixed(3),
      ]);
    }
  }
}

writeFileSync(
  `${import.meta.dirname}/output/evaluation-summary.csv`,
  evaluationSummaryCSV.map((row) => row.join(",")).join("\n"),
);
