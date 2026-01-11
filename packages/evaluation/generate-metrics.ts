import { existsSync, readFileSync, writeFileSync } from "node:fs";
import {
  createSentenceStructureDataFromStringData,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import {
  runCount,
  geminiModelNames,
  geminiTemperatureValues,
  geminiThinkingLevelValues,
  isValidGeminiParameters,
  isValidOpenAIParameters,
  openAIModelNames,
  openAIReasoningEffortValues,
  openAIVerbosityValues,
  type Dataset,
  type GeminiLog,
  type OpenAILog,
} from "./llmConfigurations.js";
import { calculateOverallMetrics } from "./calculate-metrics.js";

const datasets: Dataset[] = JSON.parse(
  readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
);
const answerSentenceStructureDataList: SentenceStructureData[] = datasets.map(
  (dataset) => {
    const result = createSentenceStructureDataFromStringData(
      readFileSync(
        `${import.meta.dirname}/data/answer-${dataset.id}.json`,
        "utf-8",
      ),
    );
    if (!result.success) throw new Error("Failed to parse answer data.");
    return result.data.newSentenceStructureData;
  },
);

const headerRow = [
  "モデル名とパラメーター",
  "生成成功割合（再試行可）",
  "生成成功割合（再試行不可）",
  "範囲の総数",
  "完全に一致した範囲のRecall（再試行可）",
  "完全に一致した範囲のRecall（再試行不可）",
  "完全に一致した範囲のPrecision（再試行可）",
  "完全に一致した範囲のPrecision（再試行不可）",
  "完全に一致した範囲のF1（再試行可）",
  "完全に一致した範囲のF1（再試行不可）",
  "範囲が一致した範囲のRecall（再試行可）",
  "範囲が一致した範囲のRecall（再試行不可）",
  "範囲が一致した範囲のPrecision（再試行可）",
  "範囲が一致した範囲のPrecision（再試行不可）",
  "範囲が一致した範囲のF1（再試行可）",
  "範囲が一致した範囲のF1（再試行不可）",
  "関係の総数",
  "完全に一致した関係のRecall（再試行可）",
  "完全に一致した関係のRecall（再試行不可）",
  "完全に一致した関係のPrecision（再試行可）",
  "完全に一致した関係のPrecision（再試行不可）",
  "完全に一致した関係のF1（再試行可）",
  "完全に一致した関係のF1（再試行不可）",
  "範囲が一致した関係のRecall（再試行可）",
  "範囲が一致した関係のRecall（再試行不可）",
  "範囲が一致した関係のPrecision（再試行可）",
  "範囲が一致した関係のPrecision（再試行不可）",
  "範囲が一致した関係のF1（再試行可）",
  "範囲が一致した関係のF1（再試行不可）",
  "並列構造の総数",
  "完全に一致した並列構造のRecall（再試行可）",
  "完全に一致した並列構造のRecall（再試行不可）",
  "完全に一致した並列構造のPrecision（再試行可）",
  "完全に一致した並列構造のPrecision（再試行不可）",
  "完全に一致した並列構造のF1（再試行可）",
  "完全に一致した並列構造のF1（再試行不可）",
  "範囲が一致した並列構造のRecall（再試行可）",
  "範囲が一致した並列構造のRecall（再試行不可）",
  "範囲が一致した並列構造のPrecision（再試行可）",
  "範囲が一致した並列構造のPrecision（再試行不可）",
  "範囲が一致した並列構造のF1（再試行可）",
  "範囲が一致した並列構造のF1（再試行不可）",
];

const metricsCsv: string[][] = [headerRow];

for (const modelName of geminiModelNames) {
  for (const temperature of geminiTemperatureValues) {
    for (const thinkingLevel of geminiThinkingLevelValues) {
      if (!isValidGeminiParameters(modelName, temperature, thinkingLevel))
        continue;

      const allTriesMetrics = Array.from(
        { length: runCount },
        (_, runIndex) => {
          const directoryPath = `${import.meta.dirname}/output/${modelName}-${temperature}-${thinkingLevel.toLowerCase()}-${runIndex}`;
          const llmSentenceStructureDataList: (SentenceStructureData | null)[] =
            datasets.map((dataset) => {
              if (!existsSync(`${directoryPath}/${dataset.id}.json`))
                return null;
              const result = createSentenceStructureDataFromStringData(
                readFileSync(`${directoryPath}/${dataset.id}.json`, "utf-8"),
              );
              if (!result.success) throw new Error("Failed to parse LLM data.");
              return result.data.newSentenceStructureData;
            });
          return calculateOverallMetrics(
            datasets.map((_, index) => ({
              answer: answerSentenceStructureDataList.at(index)!,
              llmAnswer: llmSentenceStructureDataList.at(index) ?? null,
            })),
          );
        },
      ).reduce(
        (accumulator, currentValue) => ({
          generationRate:
            accumulator.generationRate + currentValue.generationRate / runCount,
          rangeCount:
            accumulator.rangeCount + currentValue.rangeCount / runCount,
          rangeRecall:
            accumulator.rangeRecall + currentValue.rangeRecall / runCount,
          rangePrecision:
            accumulator.rangePrecision + currentValue.rangePrecision / runCount,
          rangeF1Score:
            accumulator.rangeF1Score + currentValue.rangeF1Score / runCount,
          rangeStartAndEndWordIndexRecall:
            accumulator.rangeStartAndEndWordIndexRecall +
            currentValue.rangeStartAndEndWordIndexRecall / runCount,
          rangeStartAndEndWordIndexPrecision:
            accumulator.rangeStartAndEndWordIndexPrecision +
            currentValue.rangeStartAndEndWordIndexPrecision / runCount,
          rangeStartAndEndWordIndexF1Score:
            accumulator.rangeStartAndEndWordIndexF1Score +
            currentValue.rangeStartAndEndWordIndexF1Score / runCount,
          relationCount:
            accumulator.relationCount + currentValue.relationCount / runCount,
          relationRecall:
            accumulator.relationRecall + currentValue.relationRecall / runCount,
          relationPrecision:
            accumulator.relationPrecision +
            currentValue.relationPrecision / runCount,
          relationF1Score:
            accumulator.relationF1Score +
            currentValue.relationF1Score / runCount,
          relationStartAndEndWordIndexRecall:
            accumulator.relationStartAndEndWordIndexRecall +
            currentValue.relationStartAndEndWordIndexRecall / runCount,
          relationStartAndEndWordIndexPrecision:
            accumulator.relationStartAndEndWordIndexPrecision +
            currentValue.relationStartAndEndWordIndexPrecision / runCount,
          relationStartAndEndWordIndexF1Score:
            accumulator.relationStartAndEndWordIndexF1Score +
            currentValue.relationStartAndEndWordIndexF1Score / runCount,
          coordinationCount:
            accumulator.coordinationCount +
            currentValue.coordinationCount / runCount,
          coordinationRecall:
            accumulator.coordinationRecall +
            currentValue.coordinationRecall / runCount,
          coordinationPrecision:
            accumulator.coordinationPrecision +
            currentValue.coordinationPrecision / runCount,
          coordinationF1Score:
            accumulator.coordinationF1Score +
            currentValue.coordinationF1Score / runCount,
          coordinationStartAndEndWordIndexRecall:
            accumulator.coordinationStartAndEndWordIndexRecall +
            currentValue.coordinationStartAndEndWordIndexRecall / runCount,
          coordinationStartAndEndWordIndexPrecision:
            accumulator.coordinationStartAndEndWordIndexPrecision +
            currentValue.coordinationStartAndEndWordIndexPrecision / runCount,
          coordinationStartAndEndWordIndexF1Score:
            accumulator.coordinationStartAndEndWordIndexF1Score +
            currentValue.coordinationStartAndEndWordIndexF1Score / runCount,
        }),
        {
          generationRate: 0,
          rangeCount: 0,
          rangeRecall: 0,
          rangePrecision: 0,
          rangeF1Score: 0,
          rangeStartAndEndWordIndexRecall: 0,
          rangeStartAndEndWordIndexPrecision: 0,
          rangeStartAndEndWordIndexF1Score: 0,
          relationCount: 0,
          relationRecall: 0,
          relationPrecision: 0,
          relationF1Score: 0,
          relationStartAndEndWordIndexRecall: 0,
          relationStartAndEndWordIndexPrecision: 0,
          relationStartAndEndWordIndexF1Score: 0,
          coordinationCount: 0,
          coordinationRecall: 0,
          coordinationPrecision: 0,
          coordinationF1Score: 0,
          coordinationStartAndEndWordIndexRecall: 0,
          coordinationStartAndEndWordIndexPrecision: 0,
          coordinationStartAndEndWordIndexF1Score: 0,
        },
      );

      const firstTryMetrics = Array.from(
        { length: runCount },
        (_, runIndex) => {
          const directoryPath = `${import.meta.dirname}/output/${modelName}-${temperature}-${thinkingLevel.toLowerCase()}-${runIndex}`;
          const logs: GeminiLog[] | null = existsSync(
            `${directoryPath}/logs.json`,
          )
            ? JSON.parse(readFileSync(`${directoryPath}/logs.json`, "utf-8"))
            : null;
          const llmSentenceStructureDataList: (SentenceStructureData | null)[] =
            datasets.map((dataset) => {
              const log = logs?.find((log) => log.id === dataset.id);
              if (
                !existsSync(`${directoryPath}/${dataset.id}.json`) ||
                !log ||
                1 < log.retries.length
              )
                return null;
              const result = createSentenceStructureDataFromStringData(
                readFileSync(`${directoryPath}/${dataset.id}.json`, "utf-8"),
              );
              if (!result.success) throw new Error("Failed to parse LLM data.");
              return result.data.newSentenceStructureData;
            });
          return calculateOverallMetrics(
            datasets.map((_, index) => ({
              answer: answerSentenceStructureDataList.at(index)!,
              llmAnswer: llmSentenceStructureDataList.at(index) ?? null,
            })),
          );
        },
      ).reduce(
        (accumulator, currentValue) => ({
          generationRate:
            accumulator.generationRate + currentValue.generationRate / runCount,
          rangeCount:
            accumulator.rangeCount + currentValue.rangeCount / runCount,
          rangeRecall:
            accumulator.rangeRecall + currentValue.rangeRecall / runCount,
          rangePrecision:
            accumulator.rangePrecision + currentValue.rangePrecision / runCount,
          rangeF1Score:
            accumulator.rangeF1Score + currentValue.rangeF1Score / runCount,
          rangeStartAndEndWordIndexRecall:
            accumulator.rangeStartAndEndWordIndexRecall +
            currentValue.rangeStartAndEndWordIndexRecall / runCount,
          rangeStartAndEndWordIndexPrecision:
            accumulator.rangeStartAndEndWordIndexPrecision +
            currentValue.rangeStartAndEndWordIndexPrecision / runCount,
          rangeStartAndEndWordIndexF1Score:
            accumulator.rangeStartAndEndWordIndexF1Score +
            currentValue.rangeStartAndEndWordIndexF1Score / runCount,
          relationCount:
            accumulator.relationCount + currentValue.relationCount / runCount,
          relationRecall:
            accumulator.relationRecall + currentValue.relationRecall / runCount,
          relationPrecision:
            accumulator.relationPrecision +
            currentValue.relationPrecision / runCount,
          relationF1Score:
            accumulator.relationF1Score +
            currentValue.relationF1Score / runCount,
          relationStartAndEndWordIndexRecall:
            accumulator.relationStartAndEndWordIndexRecall +
            currentValue.relationStartAndEndWordIndexRecall / runCount,
          relationStartAndEndWordIndexPrecision:
            accumulator.relationStartAndEndWordIndexPrecision +
            currentValue.relationStartAndEndWordIndexPrecision / runCount,
          relationStartAndEndWordIndexF1Score:
            accumulator.relationStartAndEndWordIndexF1Score +
            currentValue.relationStartAndEndWordIndexF1Score / runCount,
          coordinationCount:
            accumulator.coordinationCount +
            currentValue.coordinationCount / runCount,
          coordinationRecall:
            accumulator.coordinationRecall +
            currentValue.coordinationRecall / runCount,
          coordinationPrecision:
            accumulator.coordinationPrecision +
            currentValue.coordinationPrecision / runCount,
          coordinationF1Score:
            accumulator.coordinationF1Score +
            currentValue.coordinationF1Score / runCount,
          coordinationStartAndEndWordIndexRecall:
            accumulator.coordinationStartAndEndWordIndexRecall +
            currentValue.coordinationStartAndEndWordIndexRecall / runCount,
          coordinationStartAndEndWordIndexPrecision:
            accumulator.coordinationStartAndEndWordIndexPrecision +
            currentValue.coordinationStartAndEndWordIndexPrecision / runCount,
          coordinationStartAndEndWordIndexF1Score:
            accumulator.coordinationStartAndEndWordIndexF1Score +
            currentValue.coordinationStartAndEndWordIndexF1Score / runCount,
        }),
        {
          generationRate: 0,
          rangeCount: 0,
          rangeRecall: 0,
          rangePrecision: 0,
          rangeF1Score: 0,
          rangeStartAndEndWordIndexRecall: 0,
          rangeStartAndEndWordIndexPrecision: 0,
          rangeStartAndEndWordIndexF1Score: 0,
          relationCount: 0,
          relationRecall: 0,
          relationPrecision: 0,
          relationF1Score: 0,
          relationStartAndEndWordIndexRecall: 0,
          relationStartAndEndWordIndexPrecision: 0,
          relationStartAndEndWordIndexF1Score: 0,
          coordinationCount: 0,
          coordinationRecall: 0,
          coordinationPrecision: 0,
          coordinationF1Score: 0,
          coordinationStartAndEndWordIndexRecall: 0,
          coordinationStartAndEndWordIndexPrecision: 0,
          coordinationStartAndEndWordIndexF1Score: 0,
        },
      );

      metricsCsv.push([
        `${modelName} temperature=${temperature} thinkingLevel=${thinkingLevel}`,
        allTriesMetrics.generationRate.toFixed(3),
        firstTryMetrics.generationRate.toFixed(3),
        allTriesMetrics.rangeCount.toString(),
        allTriesMetrics.rangeRecall.toFixed(3),
        firstTryMetrics.rangeRecall.toFixed(3),
        allTriesMetrics.rangePrecision.toFixed(3),
        firstTryMetrics.rangePrecision.toFixed(3),
        allTriesMetrics.rangeF1Score.toFixed(3),
        firstTryMetrics.rangeF1Score.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexF1Score.toFixed(3),
        allTriesMetrics.relationCount.toString(),
        allTriesMetrics.relationRecall.toFixed(3),
        firstTryMetrics.relationRecall.toFixed(3),
        allTriesMetrics.relationPrecision.toFixed(3),
        firstTryMetrics.relationPrecision.toFixed(3),
        allTriesMetrics.relationF1Score.toFixed(3),
        firstTryMetrics.relationF1Score.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexF1Score.toFixed(3),
        allTriesMetrics.coordinationCount.toString(),
        allTriesMetrics.coordinationRecall.toFixed(3),
        firstTryMetrics.coordinationRecall.toFixed(3),
        allTriesMetrics.coordinationPrecision.toFixed(3),
        firstTryMetrics.coordinationPrecision.toFixed(3),
        allTriesMetrics.coordinationF1Score.toFixed(3),
        firstTryMetrics.coordinationF1Score.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexF1Score.toFixed(3),
      ]);
    }
  }
}

for (const modelName of openAIModelNames) {
  for (const reasoningEffort of openAIReasoningEffortValues) {
    for (const verbosity of openAIVerbosityValues) {
      if (!isValidOpenAIParameters(modelName, reasoningEffort, verbosity))
        continue;

      const allTriesMetrics = Array.from(
        { length: runCount },
        (_, runIndex) => {
          const directoryPath = `${import.meta.dirname}/output/${modelName}-${reasoningEffort}-${verbosity}-${runIndex}`;
          const llmSentenceStructureDataList: (SentenceStructureData | null)[] =
            datasets.map((dataset) => {
              if (!existsSync(`${directoryPath}/${dataset.id}.json`))
                return null;
              const result = createSentenceStructureDataFromStringData(
                readFileSync(`${directoryPath}/${dataset.id}.json`, "utf-8"),
              );
              if (!result.success) throw new Error("Failed to parse LLM data.");
              return result.data.newSentenceStructureData;
            });
          return calculateOverallMetrics(
            datasets.map((_, index) => ({
              answer: answerSentenceStructureDataList.at(index)!,
              llmAnswer: llmSentenceStructureDataList.at(index) ?? null,
            })),
          );
        },
      ).reduce(
        (accumulator, currentValue) => ({
          generationRate:
            accumulator.generationRate + currentValue.generationRate / runCount,
          rangeCount:
            accumulator.rangeCount + currentValue.rangeCount / runCount,
          rangeRecall:
            accumulator.rangeRecall + currentValue.rangeRecall / runCount,
          rangePrecision:
            accumulator.rangePrecision + currentValue.rangePrecision / runCount,
          rangeF1Score:
            accumulator.rangeF1Score + currentValue.rangeF1Score / runCount,
          rangeStartAndEndWordIndexRecall:
            accumulator.rangeStartAndEndWordIndexRecall +
            currentValue.rangeStartAndEndWordIndexRecall / runCount,
          rangeStartAndEndWordIndexPrecision:
            accumulator.rangeStartAndEndWordIndexPrecision +
            currentValue.rangeStartAndEndWordIndexPrecision / runCount,
          rangeStartAndEndWordIndexF1Score:
            accumulator.rangeStartAndEndWordIndexF1Score +
            currentValue.rangeStartAndEndWordIndexF1Score / runCount,
          relationCount:
            accumulator.relationCount + currentValue.relationCount / runCount,
          relationRecall:
            accumulator.relationRecall + currentValue.relationRecall / runCount,
          relationPrecision:
            accumulator.relationPrecision +
            currentValue.relationPrecision / runCount,
          relationF1Score:
            accumulator.relationF1Score +
            currentValue.relationF1Score / runCount,
          relationStartAndEndWordIndexRecall:
            accumulator.relationStartAndEndWordIndexRecall +
            currentValue.relationStartAndEndWordIndexRecall / runCount,
          relationStartAndEndWordIndexPrecision:
            accumulator.relationStartAndEndWordIndexPrecision +
            currentValue.relationStartAndEndWordIndexPrecision / runCount,
          relationStartAndEndWordIndexF1Score:
            accumulator.relationStartAndEndWordIndexF1Score +
            currentValue.relationStartAndEndWordIndexF1Score / runCount,
          coordinationCount:
            accumulator.coordinationCount +
            currentValue.coordinationCount / runCount,
          coordinationRecall:
            accumulator.coordinationRecall +
            currentValue.coordinationRecall / runCount,
          coordinationPrecision:
            accumulator.coordinationPrecision +
            currentValue.coordinationPrecision / runCount,
          coordinationF1Score:
            accumulator.coordinationF1Score +
            currentValue.coordinationF1Score / runCount,
          coordinationStartAndEndWordIndexRecall:
            accumulator.coordinationStartAndEndWordIndexRecall +
            currentValue.coordinationStartAndEndWordIndexRecall / runCount,
          coordinationStartAndEndWordIndexPrecision:
            accumulator.coordinationStartAndEndWordIndexPrecision +
            currentValue.coordinationStartAndEndWordIndexPrecision / runCount,
          coordinationStartAndEndWordIndexF1Score:
            accumulator.coordinationStartAndEndWordIndexF1Score +
            currentValue.coordinationStartAndEndWordIndexF1Score / runCount,
        }),
        {
          generationRate: 0,
          rangeCount: 0,
          rangeRecall: 0,
          rangePrecision: 0,
          rangeF1Score: 0,
          rangeStartAndEndWordIndexRecall: 0,
          rangeStartAndEndWordIndexPrecision: 0,
          rangeStartAndEndWordIndexF1Score: 0,
          relationCount: 0,
          relationRecall: 0,
          relationPrecision: 0,
          relationF1Score: 0,
          relationStartAndEndWordIndexRecall: 0,
          relationStartAndEndWordIndexPrecision: 0,
          relationStartAndEndWordIndexF1Score: 0,
          coordinationCount: 0,
          coordinationRecall: 0,
          coordinationPrecision: 0,
          coordinationF1Score: 0,
          coordinationStartAndEndWordIndexRecall: 0,
          coordinationStartAndEndWordIndexPrecision: 0,
          coordinationStartAndEndWordIndexF1Score: 0,
        },
      );

      const firstTryMetrics = Array.from(
        { length: runCount },
        (_, runIndex) => {
          const directoryPath = `${import.meta.dirname}/output/${modelName}-${reasoningEffort}-${verbosity}-${runIndex}`;
          const logs: OpenAILog[] | null = existsSync(
            `${directoryPath}/logs.json`,
          )
            ? JSON.parse(readFileSync(`${directoryPath}/logs.json`, "utf-8"))
            : null;
          const llmSentenceStructureDataList: (SentenceStructureData | null)[] =
            datasets.map((dataset) => {
              const log = logs?.find((log) => log.id === dataset.id);
              if (
                !existsSync(`${directoryPath}/${dataset.id}.json`) ||
                !log ||
                1 < log.retries.length
              )
                return null;
              const result = createSentenceStructureDataFromStringData(
                readFileSync(`${directoryPath}/${dataset.id}.json`, "utf-8"),
              );
              if (!result.success) throw new Error("Failed to parse LLM data.");
              return result.data.newSentenceStructureData;
            });
          return calculateOverallMetrics(
            datasets.map((_, index) => ({
              answer: answerSentenceStructureDataList.at(index)!,
              llmAnswer: llmSentenceStructureDataList.at(index) ?? null,
            })),
          );
        },
      ).reduce(
        (accumulator, currentValue) => ({
          generationRate:
            accumulator.generationRate + currentValue.generationRate / runCount,
          rangeCount:
            accumulator.rangeCount + currentValue.rangeCount / runCount,
          rangeRecall:
            accumulator.rangeRecall + currentValue.rangeRecall / runCount,
          rangePrecision:
            accumulator.rangePrecision + currentValue.rangePrecision / runCount,
          rangeF1Score:
            accumulator.rangeF1Score + currentValue.rangeF1Score / runCount,
          rangeStartAndEndWordIndexRecall:
            accumulator.rangeStartAndEndWordIndexRecall +
            currentValue.rangeStartAndEndWordIndexRecall / runCount,
          rangeStartAndEndWordIndexPrecision:
            accumulator.rangeStartAndEndWordIndexPrecision +
            currentValue.rangeStartAndEndWordIndexPrecision / runCount,
          rangeStartAndEndWordIndexF1Score:
            accumulator.rangeStartAndEndWordIndexF1Score +
            currentValue.rangeStartAndEndWordIndexF1Score / runCount,
          relationCount:
            accumulator.relationCount + currentValue.relationCount / runCount,
          relationRecall:
            accumulator.relationRecall + currentValue.relationRecall / runCount,
          relationPrecision:
            accumulator.relationPrecision +
            currentValue.relationPrecision / runCount,
          relationF1Score:
            accumulator.relationF1Score +
            currentValue.relationF1Score / runCount,
          relationStartAndEndWordIndexRecall:
            accumulator.relationStartAndEndWordIndexRecall +
            currentValue.relationStartAndEndWordIndexRecall / runCount,
          relationStartAndEndWordIndexPrecision:
            accumulator.relationStartAndEndWordIndexPrecision +
            currentValue.relationStartAndEndWordIndexPrecision / runCount,
          relationStartAndEndWordIndexF1Score:
            accumulator.relationStartAndEndWordIndexF1Score +
            currentValue.relationStartAndEndWordIndexF1Score / runCount,
          coordinationCount:
            accumulator.coordinationCount +
            currentValue.coordinationCount / runCount,
          coordinationRecall:
            accumulator.coordinationRecall +
            currentValue.coordinationRecall / runCount,
          coordinationPrecision:
            accumulator.coordinationPrecision +
            currentValue.coordinationPrecision / runCount,
          coordinationF1Score:
            accumulator.coordinationF1Score +
            currentValue.coordinationF1Score / runCount,
          coordinationStartAndEndWordIndexRecall:
            accumulator.coordinationStartAndEndWordIndexRecall +
            currentValue.coordinationStartAndEndWordIndexRecall / runCount,
          coordinationStartAndEndWordIndexPrecision:
            accumulator.coordinationStartAndEndWordIndexPrecision +
            currentValue.coordinationStartAndEndWordIndexPrecision / runCount,
          coordinationStartAndEndWordIndexF1Score:
            accumulator.coordinationStartAndEndWordIndexF1Score +
            currentValue.coordinationStartAndEndWordIndexF1Score / runCount,
        }),
        {
          generationRate: 0,
          rangeCount: 0,
          rangeRecall: 0,
          rangePrecision: 0,
          rangeF1Score: 0,
          rangeStartAndEndWordIndexRecall: 0,
          rangeStartAndEndWordIndexPrecision: 0,
          rangeStartAndEndWordIndexF1Score: 0,
          relationCount: 0,
          relationRecall: 0,
          relationPrecision: 0,
          relationF1Score: 0,
          relationStartAndEndWordIndexRecall: 0,
          relationStartAndEndWordIndexPrecision: 0,
          relationStartAndEndWordIndexF1Score: 0,
          coordinationCount: 0,
          coordinationRecall: 0,
          coordinationPrecision: 0,
          coordinationF1Score: 0,
          coordinationStartAndEndWordIndexRecall: 0,
          coordinationStartAndEndWordIndexPrecision: 0,
          coordinationStartAndEndWordIndexF1Score: 0,
        },
      );

      metricsCsv.push([
        `${modelName} reasoning.effort=${reasoningEffort} verbosity=${verbosity}`,
        allTriesMetrics.generationRate.toFixed(3),
        firstTryMetrics.generationRate.toFixed(3),
        allTriesMetrics.rangeCount.toString(),
        allTriesMetrics.rangeRecall.toFixed(3),
        firstTryMetrics.rangeRecall.toFixed(3),
        allTriesMetrics.rangePrecision.toFixed(3),
        firstTryMetrics.rangePrecision.toFixed(3),
        allTriesMetrics.rangeF1Score.toFixed(3),
        firstTryMetrics.rangeF1Score.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.rangeStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.rangeStartAndEndWordIndexF1Score.toFixed(3),
        allTriesMetrics.relationCount.toString(),
        allTriesMetrics.relationRecall.toFixed(3),
        firstTryMetrics.relationRecall.toFixed(3),
        allTriesMetrics.relationPrecision.toFixed(3),
        firstTryMetrics.relationPrecision.toFixed(3),
        allTriesMetrics.relationF1Score.toFixed(3),
        firstTryMetrics.relationF1Score.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.relationStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.relationStartAndEndWordIndexF1Score.toFixed(3),
        allTriesMetrics.coordinationCount.toString(),
        allTriesMetrics.coordinationRecall.toFixed(3),
        firstTryMetrics.coordinationRecall.toFixed(3),
        allTriesMetrics.coordinationPrecision.toFixed(3),
        firstTryMetrics.coordinationPrecision.toFixed(3),
        allTriesMetrics.coordinationF1Score.toFixed(3),
        firstTryMetrics.coordinationF1Score.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexRecall.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexRecall.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexPrecision.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexPrecision.toFixed(3),
        allTriesMetrics.coordinationStartAndEndWordIndexF1Score.toFixed(3),
        firstTryMetrics.coordinationStartAndEndWordIndexF1Score.toFixed(3),
      ]);
    }
  }
}

writeFileSync(
  `${import.meta.dirname}/output/metrics.csv`,
  metricsCsv.map((row) => row.join(",")).join("\n"),
);
