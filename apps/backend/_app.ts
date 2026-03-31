import { publicProcedure, router } from "./trpc.js";
import * as z from "zod";
import { SimplifiedSentenceStructureDocumentSchema } from "@sv-marker/sentence-structure-document";
import { generateSimplifiedSentenceStructureDocumentWithStanza } from "./generate-simplified-sentence-structure-document-with-stanza.js";
import { reviseSimplifiedSentenceStructureDocumentWithGemini } from "./revise-simplified-sentence-structure-document-with-gemini.js";

export const appRouter = router({
  status: publicProcedure
    .output(z.object({ status: z.literal("ok") }))
    .query(() => ({ status: "ok" })),
  generateSimplifiedSentenceStructureDocument: publicProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .output(SimplifiedSentenceStructureDocumentSchema)
    .mutation(async (opts) => {
      const text = opts.input.text;
      console.log(`Input text: ${text}`);

      return await generateSimplifiedSentenceStructureDocumentWithStanza(text);
    }),
  reviseSimplifiedSentenceStructureDocument: publicProcedure
    .input(
      z.object({
        userRevisionInstruction: z.string(),
        baseSimplifiedSentenceStructureDocument:
          SimplifiedSentenceStructureDocumentSchema,
      }),
    )
    .output(SimplifiedSentenceStructureDocumentSchema)
    .mutation(async (opts) =>
      reviseSimplifiedSentenceStructureDocumentWithGemini(
        opts.input.userRevisionInstruction,
        opts.input.baseSimplifiedSentenceStructureDocument,
      ),
    ),
});
