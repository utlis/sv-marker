import {
  createSentenceStructureDocumentFromWords,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import type { StanzaTokenizedDocument } from "./types.js";

export function createSentenceStructureDocumentFromStanzaTokenizedDocument(
  stanzaTokenizedDocument: StanzaTokenizedDocument,
): SentenceStructureDocument {
  return createSentenceStructureDocumentFromWords(
    stanzaTokenizedDocument.sentences.map((sentence) => ({
      words: sentence.tokens.flatMap((token) =>
        token.words.map((word, index) => ({
          text: word.text,
          whitespaceAfter:
            index === token.words.length - 1 ? token.spaces_after : "",
        })),
      ),
    })),
  );
}
