import createClient from "openapi-fetch";
import type { paths } from "./generated/stanza-server/schema.js";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToText,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { examples } from "./examples.js";
import {
  createSentenceStructureDocumentFromStanzaParsedDocument,
  createSentenceStructureDocumentFromStanzaTokenizedDocument,
} from "@sv-marker/sentence-structure-document-from-stanza";
import { sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString } from "./sentence-structure-annotations-output-schema.js";

const client = createClient<paths>({
  baseUrl: process.env.STANZA_SERVER_ORIGIN ?? "",
});

export type Prompt = {
  systemInstruction: string;
  userInput: string;
};

export type GeneratePromptOptions = {
  includeStanzaParseResult?: boolean;
  includeSentenceStructureAnnotationsOutput?: boolean;
};

async function getSentenceStructureDocumentFromStanzaTokenization(
  text: string,
): Promise<SentenceStructureDocument> {
  const { data } = await client.POST("/tokenize", {
    body: {
      text,
    },
  });
  if (!data) {
    throw new Error(
      "Failed to generate sentence structure document from Stanza",
    );
  }
  return createSentenceStructureDocumentFromStanzaTokenizedDocument(data);
}

async function getSentenceStructureAnnotationsOutputJSONStringFromStanza(
  text: string,
): Promise<string> {
  const { data } = await client.POST("/parse", {
    body: {
      text,
    },
  });
  if (!data) {
    throw new Error(
      "Failed to generate sentence structure annotations output from Stanza",
    );
  }
  return sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString(
    createSentenceStructureDocumentFromStanzaParsedDocument(data),
  );
}

async function getStanzaParseResult(text: string): Promise<string> {
  const { data } = await client.POST("/parse/conllu", {
    body: {
      text,
    },
  });
  if (!data) {
    throw new Error("Failed to generate Stanza CoNLL");
  }
  return data;
}

async function generateExamplePrompt(
  options: GeneratePromptOptions,
): Promise<string> {
  return (
    await Promise.all(
      examples.map(async (example, exampleIndex) => {
        const sentenceStructureDocument =
          createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
            example,
          );
        const exampleText = sentenceStructureDocumentToText(
          sentenceStructureDocument,
        );

        return `\
## 例${exampleIndex + 1}

### 入力

【英文】
${exampleText}

【英文の単語と対応するインデックスの関係】
${sentenceStructureDocument.sentences
  .map((sentence) =>
    sentence.words.map((word) => `${word.text}：${word.index}`).join("\n"),
  )
  .join("\n\n")}
${options.includeStanzaParseResult ? `\n【Stanzaの解析結果】\n${await getStanzaParseResult(exampleText)}\n` : ""}\
${options.includeSentenceStructureAnnotationsOutput ? `\n【出力JSONの下書き】\n${await getSentenceStructureAnnotationsOutputJSONStringFromStanza(exampleText)}\n` : ""}\

### 出力JSON

${sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString(sentenceStructureDocument)}`;
      }),
    )
  ).join("\n\n");
}

const examplePromptCache = new Map<string, string>();

async function getExamplePrompt(
  options?: GeneratePromptOptions,
): Promise<string> {
  const includeStanzaParseResult = options?.includeStanzaParseResult ?? false;
  const includeSentenceStructureAnnotationsOutput =
    options?.includeSentenceStructureAnnotationsOutput ?? false;
  const cacheKey = `${includeStanzaParseResult}:${includeSentenceStructureAnnotationsOutput}`;
  const cachedExamplePrompt = examplePromptCache.get(cacheKey);
  if (cachedExamplePrompt) {
    return cachedExamplePrompt;
  }

  const examplePrompt = await generateExamplePrompt({
    includeStanzaParseResult,
    includeSentenceStructureAnnotationsOutput,
  });
  examplePromptCache.set(cacheKey, examplePrompt);
  return examplePrompt;
}

export async function generatePrompt(
  text: string,
  options?: GeneratePromptOptions,
): Promise<Prompt> {
  const sentenceStructureDocumentFromStanza =
    await getSentenceStructureDocumentFromStanzaTokenization(text);

  const instructionText = `\
あなたは英語学習者向けに英文の構造を解析する専門家です。
入力として、英文と、その英文の単語と対応するインデックスの関係を与えます。
${options?.includeStanzaParseResult ? "CoNLL-U形式のStanzaの解析結果も参考情報として与えます。\n" : ""}\
${options?.includeSentenceStructureAnnotationsOutput ? "出力JSONの下書きも参考情報として与えます。\n" : ""}\
与えられた英文の構造を解析し、指定された形式のJSONデータを生成してください。

## 要件

- 英文の単語と対応するインデックスの関係は、必ずこちらが与えるものをそのまま使用してください。
${options?.includeStanzaParseResult ? "- Stanzaの解析結果はあくまでも参考情報です。Stanzaの解析結果に無理に従う必要はありません。\n" : ""}\
${options?.includeSentenceStructureAnnotationsOutput ? "- 出力JSONの下書きを参考にし、必要に応じて修正してください。\n" : ""}\
- すべての文の主要素や文の構成要素に対して、文構造要素（文の主要素・準動詞句・節・修飾語句）を作成してください。
- 文構造要素が並列になっている場合は、並列構造全体ではなく、それぞれの構成要素ごとに文構造要素を作成してください。
- 準動詞句や節の内部の文の主要素や文の構成要素に対しても、文構造要素を作成してください。
- 文構造要素の範囲には、その要素の前後に付く句読点を含めないでください。
- すべての文の主要素に対してS・V・O・Cのいずれかを、すべての名詞句と名詞節に対してS・O・C・nullのいずれかを、すべての形容詞句と副詞節に対してC・nullのいずれかを割り当ててください。形容詞節・副詞句・修飾語句に対してはnullを割り当ててください。
- 準動詞句や節が他の名詞を中心とする語句を修飾している場合には、修飾要素と被修飾要素間の修飾関係をすべて作成してください。それ以外の場合には、修飾関係を作成しないでください。
- 修飾関係を作成する際に被修飾要素が文の主要素や文の構成要素でない場合に限り、修飾関係の要素を作成することができます。それ以外の場合には、修飾関係の要素を作成しないでください。
- 等位接続詞や相関接続詞による並列関係がある場合には、すべての並列関係を作成してください。
- 並列関係を作成する際には、並列関係を構成するすべての構成要素に対して並列関係の構成要素（等位接続詞・相関接続詞・並列要素）を作成してください。
- 並列関係の構成要素の範囲の開始と終了を表す単語のインデックスは、隣の構成要素の範囲を表す単語のインデックスと完全に連続している必要があります。そのため、並列要素同士を区切る句読点は直前の構成要素の範囲に含めてください。
- \`Tom, my brother,\`の\`my brother\`のような同格の語句には、文構造要素を作成しないでください。\`the news that ...\`の\`that ...\`のような同格のthat節には、名詞節として文構造要素を作成してください。`;

  const examplePrompt = await getExamplePrompt(options);

  return {
    systemInstruction: `\
${instructionText}

${examplePrompt}`,
    userInput: `\
【英文】
${text}

【英文の単語と対応するインデックスの関係】
${sentenceStructureDocumentFromStanza.sentences
  .map((sentence) =>
    sentence.words.map((word) => `${word.text}：${word.index}`).join("\n"),
  )
  .join("\n\n")}\
${options?.includeStanzaParseResult ? `\n\n【Stanzaの解析結果】\n${await getStanzaParseResult(text)}` : ""}\
${options?.includeSentenceStructureAnnotationsOutput ? `\n\n【出力JSONの下書き】\n${await getSentenceStructureAnnotationsOutputJSONStringFromStanza(text)}` : ""}\
`,
  };
}
