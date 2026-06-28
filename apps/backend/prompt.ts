import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToText,
  type SimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { examples } from "./examples.js";
import { sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString } from "./sentence-structure-annotations-output-schema.js";

export type Prompt = {
  systemInstruction: string;
  userInput: string;
};

export async function generatePrompt(
  userRevisionInstruction: string,
  baseSimplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument,
): Promise<Prompt> {
  const baseSentenceStructureDocument =
    createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
      baseSimplifiedSentenceStructureDocument,
    );

  const instructionText = `\
あなたは英語学習者向けに英文の構造を解析する専門家です。
入力として、英文、その英文の単語と対応するインデックスの関係、ユーザーの修正指示、修正前JSONを与えます。
与えられた英文の構造を解析し、ユーザーの修正指示に従って修正後のJSONを生成してください。
「必ず守ること」を守ったうえで、ユーザーの修正指示に従ってください。ユーザーの修正指示がない箇所は、「ユーザーの指示がない場合の標準方針」に従って補完してください。

## 必ず守ること

- 英文の単語と対応するインデックスの関係は、必ずこちらが与えるものをそのまま使用してください。
- 文の主要素や文の構成要素に対して、文構造要素（文の主要素・準動詞句・節・修飾語句）を作成してください。
- 文構造要素に対して、文の要素（S・V・O・C・M・null）を割り当ててください。
- 修飾要素と被修飾要素間の修飾関係に対して、修飾関係を作成してください。
- 修飾関係を作成する際に修飾要素あるいは被修飾要素が文の主要素や文の構成要素でない場合に限り、修飾関係の要素を作成することができます。それ以外の場合には、修飾関係の要素を作成しないでください。
- 等位接続詞や相関接続詞による並列関係に対して、並列関係を作成してください。
- 並列関係を作成する際には、並列関係を構成するすべての構成要素に対して並列関係の構成要素（等位接続詞、相関接続詞、並列要素）を作成してください。
- 並列関係の構成要素の範囲の開始と終了を表す単語のインデックスは、隣の構成要素のインデックスと完全に連続している必要があります。

## ユーザーの指示がない場合の標準方針

- すべての文構造要素に対して、文構造要素を作成してください。
- 文構造要素が並列になっている場合は、並列構造全体ではなく、それぞれの構成要素ごとに文構造要素を作成してください。
- 準動詞句や節の内部の文の主要素や文の構成要素に対しても、文構造要素を作成してください。
- すべての文の主要素に対してS・V・O・Cのいずれかを、すべての名詞句と名詞節に対してS・O・C・nullのいずれかを、すべての副詞節に対してC・nullのいずれかを割り当ててください。形容詞句や形容詞節、副詞句、修飾語句に対してはnullを割り当ててください。
- 準動詞句や節が他の名詞を修飾している場合には、修飾関係をすべて作成してください。それ以外の場合には、修飾関係を作成しないでください。
- すべての並列関係に対して、並列関係を作成してください。`;

  const examplePrompt = examples
    .map((example, exampleIndex) => {
      const sentenceStructureDocument =
        createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
          example,
        );

      return `\
## 例${exampleIndex + 1}
英文：${sentenceStructureDocumentToText(sentenceStructureDocument)}
英文の単語と対応するインデックスの関係：
  ${sentenceStructureDocument.sentences
    .map((sentence) =>
      sentence.words.map((word) => `${word.text}：${word.index}`).join("\n  "),
    )
    .join("\n\n  ")}
JSON：
${sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString(sentenceStructureDocument)}`;
    })
    .join("\n\n");

  return {
    systemInstruction: `\
${instructionText}

${examplePrompt}`,
    userInput: `\
英文：${sentenceStructureDocumentToText(baseSentenceStructureDocument)}
英文の単語と対応するインデックスの関係：
  ${baseSimplifiedSentenceStructureDocument.sentences
    .map((sentence) =>
      sentence.words.map((word) => `${word.text}：${word.index}`).join("\n  "),
    )
    .join("\n\n  ")}
ユーザーの修正指示：
${userRevisionInstruction.trim() || "ユーザーからの追加指示はありません。"}
修正前JSON：
${sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString(baseSentenceStructureDocument)}\
`,
  };
}
