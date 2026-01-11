import type { GenerateContentResponse } from "@google/genai";
import type { ParsedResponse } from "openai/resources/responses/responses.js";
import type { SimplifiedAnnotationData } from "@sentence-structure-diagram-app/sentence-structure-data";
import type { Prompt } from "./prompt.js";

export type Dataset = {
  id: number;
  englishText: string;
};

export const runCount = 5;
export const retryCount = 10;

export const geminiModelNames = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview",
] as const;
export type GeminiModelName = (typeof geminiModelNames)[number];
export const geminiTemperatureValues = [0, 0.5, 1, 1.5, 2] as const;
export type GeminiTemperature = (typeof geminiTemperatureValues)[number];
export const geminiThinkingLevelValues = ["LOW", "HIGH"] as const;
export type GeminiThinkingLevel = (typeof geminiThinkingLevelValues)[number];

export function isValidGeminiParameters(
  modelName: GeminiModelName,
  temperature: GeminiTemperature,
  thinkingLevel: GeminiThinkingLevel,
): boolean {
  // Gemini 3以前ではthinkingLevelにLOWは指定できない cf. https://ai.google.dev/api/generate-content#ThinkingConfig
  if (
    (modelName === "gemini-2.5-pro" ||
      modelName === "gemini-2.5-flash" ||
      modelName === "gemini-2.5-flash-lite") &&
    thinkingLevel === "LOW"
  ) {
    return false;
  }
  // レート制限回避のため、最小限の組み合わせのみ許可
  if (modelName === "gemini-3-pro-preview" && temperature !== 1) {
    return false;
  }
  return true;
}

export type GeminiLog = {
  id: number;
  success: boolean;
  englishText: string;
  prompt: Prompt;
  retries: (
    | {
        success: true;
        processingTime: number;
        rawResponse: GenerateContentResponse;
      }
    | {
        success: false;
        processingTime: number;
        rawResponse: GenerateContentResponse;
        errorMessage: string;
      }
  )[];
};

export const openAIModelNames = ["gpt-5", "gpt-5.1", "gpt-5.2"] as const;
export const openAIReasoningEffortValues = [
  "none",
  "low",
  "medium",
  "high",
] as const;
export const openAIVerbosityValues = ["low", "medium", "high"] as const;

export type OpenAIModelName = (typeof openAIModelNames)[number];
export type OpenAIReasoningEffort =
  (typeof openAIReasoningEffortValues)[number];
export type OpenAIVerbosity = (typeof openAIVerbosityValues)[number];

export function isValidOpenAIParameters(
  modelName: OpenAIModelName,
  reasoningEffort: OpenAIReasoningEffort,
  verbosity: OpenAIVerbosity,
): boolean {
  // gpt-5ではreasoning.effortにnoneは指定できない cf. https://platform.openai.com/docs/api-reference/responses/create#responses_create-reasoning-effort
  if (modelName === "gpt-5" && reasoningEffort === "none") return false;
  return true;
}

export type OpenAILog = {
  id: number;
  success: boolean;
  englishText: string;
  prompt: Prompt;
  retries: (
    | {
        success: true;
        processingTime: number;
        rawResponse: ParsedResponse<SimplifiedAnnotationData>;
      }
    | {
        success: false;
        processingTime: number;
        rawResponse: ParsedResponse<SimplifiedAnnotationData>;
        errorMessage: string;
      }
  )[];
};
