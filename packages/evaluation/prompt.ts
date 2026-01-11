import * as z from "zod";
import {
  SimplifiedAnnotationDataSchema,
  type SimplifiedAnnotationData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import { examples } from "./examples.js";

export type Prompt = {
  systemInstruction: string;
  userInput: string;
};

const instructionText = `\
あなたは学習者向けに英文の構造を解析する専門家です。
これから英文を与えます。また、その英文の単語とそれに対応するインデックスの関係を与えます。
与えられた英文の構造を解析し、与えられたJSON Schemaに従ったJSONデータを生成してください。

## 要件

- 単語とそれに対応するインデックスの関係は、必ずこちらが与えるものをそのまま使用してください。
- 英文中のすべての文の要素や構成単位に対して、範囲（文の主要素、修飾語、句（ここでは準動詞句のみを指す）、節）を必ず作成してください。
- 並列構造の場合には、並列構造全体ではなく必ずそれぞれの子要素に対して範囲を作成してください。
- 句や節の入れ子の中の文の要素や構成単位に対しては、必ず範囲を作成してください。
- すべての範囲に対して、文の主要素にはS、V、O、Cのいずれかを、修飾語にはMを、句と節にはS、O、C、Mのいずれかを必ず割り当ててください。
- 句（ここでは準動詞句のみを指す）や節が他の名詞や名詞句を修飾している場合には、句や節から被修飾語句に向かう関係をすべて必ず作成してください。
- これらの関係以外には、関係を作成しないでください。
- 関係を作成する際に始点あるいは終点となる範囲が文の要素や構成単位でない場合に限り、範囲（関係）を作成することができます。それ以外の場合には、範囲（関係）を作成しないでください。
- 等位接続詞や相関接続詞による並列構造がある場合には、すべての並列構造を必ず作成してください。
- 並列構造を作成する際には、内部のすべての子要素に対して子要素（等位接続詞、相関接続詞、並列要素）を必ず作成してください。
- 子要素の範囲の開始と終了を表す単語のインデックスは、隣の子要素のインデックスと完全に連続している必要があります。`;

const examplePrompt = examples
  .map((example, index) => {
    const {
      text: _exampleText,
      words: _exampleWords,
      ..._exampleAnnotationData
    } = example;
    const exampleText = _exampleText;
    const exampleWords = _exampleWords
      .map((word) => `${word.text}：${word.index}`)
      .join("\n  ");
    const exampleAnnotationData = JSON.stringify(
      SimplifiedAnnotationDataSchema.parse(
        _exampleAnnotationData satisfies SimplifiedAnnotationData,
      ),
      null,
      2,
    );
    return `\
## 例${index + 1}
英文：${exampleText}
単語とそれに対応するインデックスの関係：
  ${exampleWords}
JSON：
${exampleAnnotationData}`;
  })
  .join("\n\n");

export function generateGeminiPrompt(text: string, words: string[]): Prompt {
  const prompt = {
    systemInstruction: `\
${instructionText}

## JSON Schema
${JSON.stringify(z.toJSONSchema(SimplifiedAnnotationDataSchema), null, 2)}

${examplePrompt}`,
    userInput: `\
英文：${text}
単語とそれに対応するインデックスの関係：
  ${words.map((word, index) => `${word}：${index}`).join("\n  ")}`,
  };
  return prompt;
}

export function generateGPTPrompt(text: string, words: string[]): Prompt {
  const prompt = {
    systemInstruction: `\
${instructionText}

${examplePrompt}`,
    userInput: `\
英文：${text}
単語とそれに対応するインデックスの関係：
  ${words.map((word, index) => `${word}：${index}`).join("\n  ")}`,
  };
  return prompt;
}

// export function generateLlamaPrompt(text: string, words: string[]) {
//   const prompt: [
//     {
//       role: "system";
//       content: string;
//     },
//     {
//       role: "user";
//       content: string;
//     },
//   ] = [
//     {
//       role: "system" as const,
//       content: `\
// ${instructionText}

// ## JSON Schema
// ${JSON.stringify(z.toJSONSchema(SimplifiedAnnotationDataSchema), null, 2)}

// ${examplePrompt}`,
//     },
//     {
//       role: "user" as const,
//       content: `\
// 英文：${text}
// 単語とそれに対応するインデックスの関係：
//   ${words.map((word, index) => `${word}：${index}`).join("\n  ")}`,
//     },
//   ];
//   return prompt;
// }
