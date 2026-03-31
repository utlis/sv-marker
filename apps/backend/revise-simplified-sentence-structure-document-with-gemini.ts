import * as z from "zod";
import { GoogleGenAI } from "@google/genai";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { generatePrompt } from "./prompt.js";
import {
  createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutputJSONString,
  SentenceStructureAnnotationsOutputSchema,
} from "./sentence-structure-annotations-output-schema.js";

const ai = new GoogleGenAI({ vertexai: true });

export async function reviseSimplifiedSentenceStructureDocumentWithGemini(
  userRevisionInstruction: string,
  baseSimplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument,
): Promise<SimplifiedSentenceStructureDocument> {
  const prompt = await generatePrompt(
    userRevisionInstruction,
    baseSimplifiedSentenceStructureDocument,
  );

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt.userInput,
      config: {
        systemInstruction: prompt.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: z.toJSONSchema(
          SentenceStructureAnnotationsOutputSchema,
        ),
      },
    });

    if (!response.text) throw new Error("AI returned no result");
    console.log("Generated JSON:", response.text);

    const sentenceStructureDocument =
      createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutputJSONString(
        createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
          baseSimplifiedSentenceStructureDocument,
        ).sentences,
        response.text,
      );
    return sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
      sentenceStructureDocument,
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}
