import {
  GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
} from "@google/genai";
import {
  createSentenceStructureDataFromSimplifiedAnnotationData,
  createSentenceStructureDataFromText,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type {
  GeminiModelName,
  GeminiTemperature,
  GeminiThinkingLevel,
} from "./llmConfigurations.js";
import { generateGeminiPrompt, type Prompt } from "./prompt.js";

const ai = new GoogleGenAI({});

export async function generateSentenceStructureDataByGemini(
  text: string,
  parameters: {
    modelName: GeminiModelName;
    temperature: GeminiTemperature;
    seed: number;
    thinkingLevel: GeminiThinkingLevel;
  },
): Promise<
  | {
      success: true;
      prompt: Prompt;
      rawResponse: GenerateContentResponse;
      sentenceStructureData: SentenceStructureData;
    }
  | {
      success: false;
      prompt: Prompt;
      rawResponse: GenerateContentResponse;
      errorMessage: string;
    }
> {
  const prompt = generateGeminiPrompt(
    text,
    createSentenceStructureDataFromText({
      text,
    }).words.map((word) => word.text),
  );
  const response = await ai.models.generateContent({
    model: parameters.modelName,
    contents: prompt.userInput,
    config: {
      systemInstruction: prompt.systemInstruction,
      responseMimeType: "application/json",
      temperature: parameters.temperature,
      seed: parameters.seed,
      ...((parameters.modelName === "gemini-3-pro-preview" ||
        parameters.modelName === "gemini-3-flash-preview") && {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel[parameters.thinkingLevel],
        },
      }),
    },
  });
  try {
    if (!response.text) throw new Error("AI returned no result");
    const json = (() => {
      try {
        return JSON.parse(response.text);
      } catch {
        throw new Error("AI returned invalid JSON");
      }
    })();
    const sentenceStructureData =
      createSentenceStructureDataFromSimplifiedAnnotationData(text, json);
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
