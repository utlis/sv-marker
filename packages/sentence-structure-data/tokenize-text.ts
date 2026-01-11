// import nlp from "compromise";
import type { Word } from "./schema.js";

const segmenter = new Intl.Segmenter("en", { granularity: "word" });
export function tokenizeText(text: string): Word[] {
  if (text.trim() === "") return [];

  return [...segmenter.segment(text)]
    .filter((segment) => segment.segment.trim() !== "")
    .map((segment, index) => ({
      index: index,
      text: segment.segment,
    }));
}

// export function tokenizeText(text: string): Word[] {
//   const tokenizedText: string[] = nlp(text)
//     .terms()
//     .json()
//     .map((term: { text: string }) => term.text);
//   return tokenizedText.map((text, index) => ({
//     index: index,
//     text: text,
//   }));
// }
