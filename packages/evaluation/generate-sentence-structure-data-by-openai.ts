import { AzureOpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod.js";
import type { ParsedResponse } from "openai/resources/responses/responses.js";
import {
  createSentenceStructureDataFromSimplifiedAnnotationData,
  createSentenceStructureDataFromText,
  SimplifiedAnnotationDataSchema,
  type SentenceStructureData,
  type SimplifiedAnnotationData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type {
  OpenAIModelName,
  OpenAIReasoningEffort,
  OpenAIVerbosity,
} from "./llmConfigurations.js";
import { generateGPTPrompt, type Prompt } from "./prompt.js";

const client = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

export async function generateSentenceStructureDataByOpenAI(
  text: string,
  parameters: {
    modelName: OpenAIModelName;
    reasoningEffort: OpenAIReasoningEffort;
    verbosity: OpenAIVerbosity;
  },
): Promise<
  | {
      success: true;
      prompt: Prompt;
      rawResponse: ParsedResponse<SimplifiedAnnotationData>;
      sentenceStructureData: SentenceStructureData;
    }
  | {
      success: false;
      prompt: Prompt;
      rawResponse: ParsedResponse<SimplifiedAnnotationData>;
      errorMessage: string;
    }
> {
  const prompt = generateGPTPrompt(
    text,
    createSentenceStructureDataFromText({
      text,
    }).words.map((word) => word.text),
  );
  const response = await client.responses.parse({
    model:
      parameters.modelName === "gpt-5"
        ? process.env.AZURE_OPENAI_GPT5_DEPLOYMENT_NAME!
        : parameters.modelName === "gpt-5.1"
          ? process.env.AZURE_OPENAI_GPT5_1_DEPLOYMENT_NAME!
          : process.env.AZURE_OPENAI_GPT5_2_DEPLOYMENT_NAME!,
    instructions: prompt.systemInstruction,
    reasoning: { effort: parameters.reasoningEffort },
    input: prompt.userInput,
    text: {
      verbosity: parameters.verbosity,
      format: zodTextFormat(
        SimplifiedAnnotationDataSchema,
        "simplified-annotation-data",
      ),
    },
  });
  try {
    if (!response.output_parsed) throw new Error("AI returned no result");
    const sentenceStructureData =
      createSentenceStructureDataFromSimplifiedAnnotationData(
        text,
        response.output_parsed,
      );
    if (sentenceStructureData.success) {
      return {
        success: true,
        prompt,
        rawResponse: response,
        sentenceStructureData:
          sentenceStructureData.data.newSentenceStructureData,
      };
    } else {
      throw new Error("AI returned JSON with invalid schema");
    }
  } catch (error) {
    return {
      success: false,
      prompt,
      rawResponse: response,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
}
