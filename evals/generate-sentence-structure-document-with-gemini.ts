import * as z from "zod";
import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import {
  GenerateContentResponse,
  GoogleGenAI,
  ThinkingLevel,
} from "@google/genai";
import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaTokenizedDocument } from "@sv-marker/sentence-structure-document-from-stanza";
import type { GeminiModelName, GeminiThinkingLevel } from "./llm-parameters.js";
import {
  generatePrompt,
  type GeneratePromptOptions,
  type Prompt,
} from "./prompt.js";
import {
  createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutputJSONString,
  SentenceStructureAnnotationsOutputSchema,
} from "./sentence-structure-annotations-output-schema.js";

const client = createClient<paths>({
  baseUrl: process.env.STANZA_SERVER_ORIGIN ?? "",
});

const ai = new GoogleGenAI({ vertexai: true });

export async function generateSentenceStructureDocumentWithGemini(
  text: string,
  parameters: {
    modelName: GeminiModelName;
    seed: number;
    thinkingLevel: GeminiThinkingLevel;
  },
  promptOptions?: GeneratePromptOptions,
): Promise<
  {
    prompt: Prompt | null;
    processingTime: number;
    rawResponse: GenerateContentResponse | null;
  } & (
    | {
        success: true;
        sentenceStructureDocument: SentenceStructureDocument;
      }
    | {
        success: false;
        errorMessage: string;
      }
  )
> {
  const startTime = Date.now();
  let prompt: Prompt;
  try {
    prompt = await generatePrompt(text, promptOptions);
  } catch (error) {
    return {
      prompt: null,
      processingTime: Date.now() - startTime,
      rawResponse: null,
      success: false,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
  const response = await ai.models.generateContent({
    model: parameters.modelName,
    contents: prompt.userInput,
    config: {
      systemInstruction: prompt.systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: z.toJSONSchema(
        SentenceStructureAnnotationsOutputSchema,
      ),
      seed: parameters.seed,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel[parameters.thinkingLevel],
      },
    },
  });
  const endTime = Date.now();

  const { data } = await client.POST("/tokenize", {
    body: {
      text,
    },
  });
  if (!data) {
    throw new Error("Failed to tokenize text with Stanza");
  }
  const sentenceStructureDocumentFromStanza =
    createSentenceStructureDocumentFromStanzaTokenizedDocument(data);

  try {
    if (!response.text) throw new Error("AI returned no result");

    const sentenceStructureDocument =
      createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutputJSONString(
        sentenceStructureDocumentFromStanza.sentences,
        response.text,
      );

    return {
      prompt,
      processingTime: endTime - startTime,
      rawResponse: response,
      success: true,
      sentenceStructureDocument,
    };
  } catch (error) {
    return {
      prompt,
      processingTime: endTime - startTime,
      rawResponse: response,
      success: false,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
}
