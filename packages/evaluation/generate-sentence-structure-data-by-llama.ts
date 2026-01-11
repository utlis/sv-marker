// import { AzureOpenAI } from "openai";
// import {
//   SimplifiedAnnotationDataSchema,
//   type SimplifiedAnnotationData,
// } from "@sentence-structure-diagram-app/sentence-structure-data";
// import { InvalidAIOutputError } from "./invalid-ai-output-error.js";

// export async function generateSimplifiedAnnotationDataByLlama(
//   prompt: [
//     {
//       role: "system";
//       content: string;
//     },
//     {
//       role: "user";
//       content: string;
//     },
//   ],
// ): Promise<SimplifiedAnnotationData> {
//   const client = new AzureOpenAI({
//     endpoint: process.env.AZURE_OPENAI_ENDPOINT,
//     apiKey: process.env.AZURE_OPENAI_API_KEY,
//     apiVersion: process.env.AZURE_OPENAI_API_VERSION,
//   });

//   try {
//     const completion = await client.chat.completions.parse({
//       model: process.env.AZURE_OPENAI_LLAMA4_DEPLOYMENT_NAME!,
//       messages: prompt,
//       response_format: { type: "json_object" },
//     });
//     const result = completion.choices[0]?.message.content;
//     if (!result) throw new InvalidAIOutputError("AI returned no result");
//     const json = (() => {
//       try {
//         return JSON.parse(result);
//       } catch {
//         throw new InvalidAIOutputError("AI returned invalid JSON");
//       }
//     })();
//     console.log("Generated JSON:", JSON.stringify(json, null, 2));
//     try {
//       return SimplifiedAnnotationDataSchema.parse(json);
//     } catch {
//       throw new InvalidAIOutputError("AI returned JSON with invalid schema");
//     }
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// }
