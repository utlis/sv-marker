import { GoogleGenAI } from "@google/genai";
import {
  SimplifiedAnnotationDataSchema,
  type SimplifiedAnnotationData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import { generateGeminiPrompt } from "@sentence-structure-diagram-app/evaluation";

const ai = new GoogleGenAI({});

export async function generateSimplifiedAnnotationDataByGemini(
  text: string,
  words: string[],
): Promise<SimplifiedAnnotationData> {
  const prompt = generateGeminiPrompt(text, words);
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt.userInput,
      config: {
        systemInstruction: prompt.systemInstruction,
        responseMimeType: "application/json",
        // responseJsonSchema: z.toJSONSchema(SimplifiedAnnotationDataSchema),
      },
    });
    if (!result.text) throw new Error("AI returned no result");
    const json = (() => {
      try {
        return JSON.parse(result.text);
      } catch {
        throw new Error("AI returned invalid JSON");
      }
    })();
    console.log("Generated JSON:", JSON.stringify(json, null, 2));
    try {
      return SimplifiedAnnotationDataSchema.parse(json);
    } catch {
      throw new Error("AI returned JSON with invalid schema");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
