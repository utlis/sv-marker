import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod.js";
import type { ParsedChatCompletion } from "openai/resources/chat/completions/completions.js";
import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaTokenizedDocument } from "@sv-marker/sentence-structure-document-from-stanza";
import type { GPTOSSReasoningEffort, VLLMModelName } from "./llm-parameters.js";
import {
  generatePrompt,
  type GeneratePromptOptions,
  type Prompt,
} from "./prompt.js";
import {
  createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutput,
  SentenceStructureAnnotationsOutputSchema,
  type SentenceStructureAnnotationsOutput,
} from "./sentence-structure-annotations-output-schema.js";

const stanzaServerClient = createClient<paths>({
  baseUrl: process.env.STANZA_SERVER_ORIGIN ?? "",
});

const openAIClient = new OpenAI({
  apiKey: process.env.VLLM_API_KEY,
  baseURL: process.env.VLLM_API_BASE_URL,
});

export async function generateSentenceStructureDocumentWithVLLM(
  text: string,
  parameters: {
    model: VLLMModelName;
    seed: number;
    enableThinking?: boolean | undefined;
    reasoningEffort?: GPTOSSReasoningEffort | undefined;
  },
  promptOptions?: GeneratePromptOptions,
): Promise<
  {
    prompt: Prompt | null;
    processingTime: number;
    rawResponse: ParsedChatCompletion<SentenceStructureAnnotationsOutput> | null;
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
  const completion = await openAIClient.chat.completions.parse({
    model: (() => {
      switch (parameters.model) {
        case "Qwen3.6-27B": {
          return "Qwen/Qwen3.6-27B";
        }
        case "gemma-4-31B-it": {
          return "google/gemma-4-31B-it";
        }
        case "gpt-oss-20b": {
          return "openai/gpt-oss-20b";
        }
        default: {
          parameters.model satisfies never;
          throw new Error("Unreachable");
        }
      }
    })(),
    messages: [
      { role: "system", content: prompt.systemInstruction },
      { role: "user", content: prompt.userInput },
    ],
    response_format: zodResponseFormat(
      SentenceStructureAnnotationsOutputSchema,
      "sentence-structure-annotations-output",
    ),
    ...(parameters.reasoningEffort
      ? { reasoning_effort: parameters.reasoningEffort }
      : {}),
    seed: parameters.seed,
    ...(parameters.enableThinking
      ? { chat_template_kwargs: { enable_thinking: parameters.enableThinking } }
      : {}),
  });
  const endTime = Date.now();

  const { data } = await stanzaServerClient.POST("/tokenize", {
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
    if (!completion.choices[0]?.message.parsed)
      throw new Error("AI returned no result");

    const sentenceStructureDocument =
      createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutput(
        sentenceStructureDocumentFromStanza.sentences,
        completion.choices[0].message.parsed,
      );

    return {
      prompt,
      processingTime: endTime - startTime,
      rawResponse: completion,
      success: true,
      sentenceStructureDocument,
    };
  } catch (error) {
    return {
      prompt,
      processingTime: endTime - startTime,
      rawResponse: completion,
      success: false,
      errorMessage: error instanceof Error ? error.message : "",
    };
  }
}
