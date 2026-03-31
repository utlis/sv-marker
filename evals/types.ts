import type { paths } from "./generated/stanza-server/schema.js";
import type { GenerateContentResponse } from "@google/genai";
import type { ParsedChatCompletion } from "openai/resources/chat/completions/completions.js";
import type { ParsedResponse } from "openai/resources/responses/responses.js";
import type { SimplifiedSentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import type { Prompt } from "./prompt.js";
import type { SentenceStructureAnnotationsOutput } from "./sentence-structure-annotations-output-schema.js";

export type Dataset = {
  id: number;
  englishText: string;
};

export type StanzaLog = {
  datasetId: number;
  englishText: string;
  processingTime: number;
  rawResponse: paths["/parse"]["post"]["responses"]["200"]["content"]["application/json"];
} & (
  | {
      success: true;
      simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument;
    }
  | {
      success: false;
      errorMessage: string;
    }
);

export type OpenAILog = {
  datasetId: number;
  englishText: string;
  prompt: Prompt | null;
  retries: ({
    processingTime: number;
    rawResponse: ParsedResponse<SentenceStructureAnnotationsOutput> | null;
  } & (
    | {
        success: true;
        simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument;
      }
    | {
        success: false;
        errorMessage: string;
      }
  ))[];
};

export type GeminiLog = {
  datasetId: number;
  englishText: string;
  prompt: Prompt | null;
  retries: ({
    processingTime: number;
    rawResponse: GenerateContentResponse | null;
  } & (
    | {
        success: true;
        simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument;
      }
    | {
        success: false;
        errorMessage: string;
      }
  ))[];
};

export type VLLMLog = {
  datasetId: number;
  englishText: string;
  prompt: Prompt | null;
  retries: ({
    processingTime: number;
    rawResponse: ParsedChatCompletion<SentenceStructureAnnotationsOutput> | null;
  } & (
    | {
        success: true;
        simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument;
      }
    | {
        success: false;
        errorMessage: string;
      }
  ))[];
};
