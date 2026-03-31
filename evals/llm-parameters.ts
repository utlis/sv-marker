export const retryCount = 3;

export const promptReferenceDataOptions = [
  "none",
  "raw-stanza-parse-result",
  "draft-sentence-structure-annotations-output",
] as const;
export type PromptReferenceDataOption =
  (typeof promptReferenceDataOptions)[number];

export const openAIModelNameOptions = [
  "gpt-5.4",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
] as const;
export type OpenAIModelName = (typeof openAIModelNameOptions)[number];

export const openAIReasoningEffortOptions = [
  "none",
  "low",
  "medium",
  "high",
] as const;
export type OpenAIReasoningEffort =
  (typeof openAIReasoningEffortOptions)[number];

export function isValidOpenAIParameters(
  modelName: OpenAIModelName,
  reasoningEffort: OpenAIReasoningEffort,
): boolean {
  return true;
}

export const geminiModelNameOptions = [
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
] as const;
export type GeminiModelName = (typeof geminiModelNameOptions)[number];

export const geminiThinkingLevelOptions = [
  "MINIMAL",
  "LOW",
  "MEDIUM",
  "HIGH",
] as const;
export type GeminiThinkingLevel = (typeof geminiThinkingLevelOptions)[number];

export function isValidGeminiParameters(
  modelName: GeminiModelName,
  thinkingLevel: GeminiThinkingLevel,
): boolean {
  // See https://web.archive.org/web/20260607023030/https://ai.google.dev/gemini-api/docs/thinking#thinking-levels
  if (modelName === "gemini-3.1-pro-preview" && thinkingLevel === "MINIMAL") {
    return false;
  }
  return true;
}

export const vllmModelNameOptions = [
  "Qwen3.6-27B",
  "gemma-4-31B-it",
  "gpt-oss-20b",
] as const;
export type VLLMModelName = (typeof vllmModelNameOptions)[number];

// See https://huggingface.co/openai/gpt-oss-20b
export const gptOSSReasoningEffortOptions = ["low", "medium", "high"] as const;
export type GPTOSSReasoningEffort =
  (typeof gptOSSReasoningEffortOptions)[number];
