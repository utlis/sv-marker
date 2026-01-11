import { publicProcedure, router } from "./trpc.js";
import * as z from "zod";
import { SimplifiedAnnotationDataSchema } from "@sentence-structure-diagram-app/sentence-structure-data";
import { generateSimplifiedAnnotationDataByGemini } from "./generate-simplified-annotation-by-gemini.js";

export const appRouter = router({
  status: publicProcedure
    .output(z.object({ status: z.literal("ok") }))
    .query(() => ({ status: "ok" })),
  generateSentenceStructure: publicProcedure
    .input(
      z.object({
        text: z.string(),
        words: z.array(z.string()),
      }),
    )
    .output(SimplifiedAnnotationDataSchema)
    .mutation(async (opts) => {
      const text = opts.input.text;
      const words = opts.input.words;
      console.log(`Input text: ${text}`);

      return await generateSimplifiedAnnotationDataByGemini(text, words);
    }),
});
