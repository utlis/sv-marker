import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import { AzureOpenAI } from "openai";
import { zodTextFormat } from "openai/helpers/zod.js";
import type { ParsedResponse } from "openai/resources/responses/responses.js";
import type { SentenceStructureDocument } from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDocumentFromStanzaTokenizedDocument } from "@sv-marker/sentence-structure-document-from-stanza";
import type {
  OpenAIModelName,
  OpenAIReasoningEffort,
} from "./llm-parameters.js";
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

const azureOpenAIClient = new AzureOpenAI({
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

export async function generateSentenceStructureDocumentWithOpenAI(
  text: string,
  parameters: {
    modelName: OpenAIModelName;
    reasoningEffort: OpenAIReasoningEffort;
  },
  promptOptions?: GeneratePromptOptions,
): Promise<
  {
    prompt: Prompt | null;
    processingTime: number;
    rawResponse: ParsedResponse<SentenceStructureAnnotationsOutput> | null;
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
  const response = await azureOpenAIClient.responses.parse({
    model: (() => {
      switch (parameters.modelName) {
        case "gpt-5.4": {
          return process.env.AZURE_OPENAI_GPT5_4_DEPLOYMENT_NAME!;
        }
        case "gpt-5.4-mini": {
          return process.env.AZURE_OPENAI_GPT5_4_MINI_DEPLOYMENT_NAME!;
        }
        case "gpt-5.4-nano": {
          return process.env.AZURE_OPENAI_GPT5_4_NANO_DEPLOYMENT_NAME!;
        }
        default: {
          parameters.modelName satisfies never;
          throw new Error("Unreachable");
        }
      }
    })(),
    instructions: prompt.systemInstruction,
    reasoning: { effort: parameters.reasoningEffort },
    input: prompt.userInput,
    text: {
      format: zodTextFormat(
        SentenceStructureAnnotationsOutputSchema,
        "sentence-structure-annotations-output",
      ),
    },
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
    if (!response.output_parsed) throw new Error("AI returned no result");

    const sentenceStructureDocument =
      createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutput(
        sentenceStructureDocumentFromStanza.sentences,
        response.output_parsed,
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
