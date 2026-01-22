import {
  createSentenceStructureDataFromWords,
  createSentenceStructureElement,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type { SpacyParseResult, Token } from "./spacy-parser.js";

function isFiniteVerb(token: Token): boolean {
  return token.verbForm === "Fin";
}

function isNonFiniteVerb(token: Token): boolean {
  return !!(token.verbForm && ["Inf", "Part", "Ger"].includes(token.verbForm));
}

function getChildren(
  token: Token,
  spacyParseResult: SpacyParseResult,
): Token[] {
  return spacyParseResult.tokens.filter(
    (token) => token.headTokenIndex === token.index,
  );
}

export function spacyParseResultToSentenceStructureData(
  spacyParseResult: SpacyParseResult,
): SentenceStructureData {
  return [
    (sentenceStructureData: SentenceStructureData) =>
      spacyParseResult.tokens.reduce((sentenceStructureData, token) => {
        if (
          spacyParseResult.nounChunks.some(
            (nounChunk) =>
              nounChunk.startIndex <= token.index &&
              token.index < nounChunk.endIndex &&
              nounChunk.startIndex <= token.headTokenIndex &&
              token.headTokenIndex < nounChunk.endIndex,
          )
        ) {
          return sentenceStructureData;
        }

        if (token.pos === "VERB") {
          const verbComplexTokens = spacyParseResult.tokens.filter(
            (candidateToken) =>
              candidateToken.index === token.index ||
              (candidateToken.headTokenIndex === token.index &&
                ["aux", "auxpass", "neg"].includes(
                  candidateToken.dependencyLabel,
                )),
          );
          const result = createSentenceStructureElement(sentenceStructureData, {
            kind: "core-sentence-element",
            startWordIndex: Math.min(
              ...verbComplexTokens.map(
                (verbComplexToken) => verbComplexToken.index,
              ),
            ),
            endWordIndex: Math.max(
              ...verbComplexTokens.map(
                (verbComplexToken) => verbComplexToken.index,
              ),
            ),
            sentenceElementName: "V",
          });
          if (!result.success)
            throw new Error(
              "Failed to create sentence structure data from dependency parse result.",
            );
          return result.data.newSentenceStructureData;
        }

        switch (token.dependencyLabel) {
          case "csubj":
          case "csubjpass":
          case "nsubj":
          case "nsubjpass": {
            if (isNonFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "phrase",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "S",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            if (isFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "clause",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "S",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            const result = createSentenceStructureElement(
              sentenceStructureData,
              {
                kind: "core-sentence-element",
                startWordIndex: token.subtreeIndices.at(0)!,
                endWordIndex: token.subtreeIndices.at(-1)!,
                sentenceElementName: "S",
              },
            );
            if (!result.success)
              throw new Error(
                "Failed to create sentence structure data from dependency parse result.",
              );
            return result.data.newSentenceStructureData;
          }
          case "ccomp":
          case "dative":
          case "dobj":
          // TODO: fix later
          case "xcomp": {
            if (isNonFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "phrase",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "O",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            if (isFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "clause",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "O",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            const result = createSentenceStructureElement(
              sentenceStructureData,
              {
                kind: "core-sentence-element",
                startWordIndex: token.subtreeIndices.at(0)!,
                endWordIndex: token.subtreeIndices.at(-1)!,
                sentenceElementName: "O",
              },
            );
            if (!result.success)
              throw new Error(
                "Failed to create sentence structure data from dependency parse result.",
              );
            return result.data.newSentenceStructureData;
          }
          case "acomp":
          case "attr":
          case "oprd": {
            if (isNonFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "phrase",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "C",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            if (isFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "clause",
                  usage: "nominal",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "C",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            const result = createSentenceStructureElement(
              sentenceStructureData,
              {
                kind: "core-sentence-element",
                startWordIndex: token.subtreeIndices.at(0)!,
                endWordIndex: token.subtreeIndices.at(-1)!,
                sentenceElementName: "C",
              },
            );
            if (!result.success)
              throw new Error(
                "Failed to create sentence structure data from dependency parse result.",
              );
            return result.data.newSentenceStructureData;
          }
          case "acl":
          case "advcl":
          case "relcl": {
            if (isNonFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "phrase",
                  usage: "adverbial",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "M",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            if (isFiniteVerb(token)) {
              const result = createSentenceStructureElement(
                sentenceStructureData,
                {
                  kind: "sentence-constituent",
                  type: "clause",
                  usage: "adverbial",
                  startWordIndex: token.subtreeIndices.at(0)!,
                  endWordIndex: token.subtreeIndices.at(-1)!,
                  sentenceElementName: "M",
                },
              );
              if (!result.success)
                throw new Error(
                  "Failed to create sentence structure data from dependency parse result.",
                );
              return result.data.newSentenceStructureData;
            }
            throw new Error(
              "Failed to create sentence structure data from dependency parse result.",
            );
          }
          case "advmod": // TODO: fix later
          case "agent":
          case "expl":
          case "npadvmod":
          case "prep":
          case "prt": {
            const result = createSentenceStructureElement(
              sentenceStructureData,
              {
                kind: "sentence-constituent",
                type: "adverbial-phrase",
                startWordIndex: token.subtreeIndices.at(0)!,
                endWordIndex: token.subtreeIndices.at(-1)!,
                sentenceElementName: "M",
              },
            );
            if (!result.success)
              throw new Error(
                "Failed to create sentence structure data from dependency parse result.",
              );
            return result.data.newSentenceStructureData;
          }
          case "ROOT":
          case "amod":
          case "appos": // TODO: fix later
          case "aux":
          case "auxpass":
          case "case":
          case "cc": // TODO: fix later
          case "compound":
          case "conj": // TODO: fix later
          case "dep":
          case "det":
          case "intj":
          case "mark":
          case "meta":
          case "neg":
          case "nmod":
          case "nummod":
          case "parataxis": // TODO: fix later
          case "pcomp":
          case "pobj":
          case "poss":
          case "preconj": // TODO: fix later
          case "predet":
          case "punct":
          case "quantmod":
            return sentenceStructureData;
          default:
            token.dependencyLabel satisfies never;
            throw new Error("Unreachable");
        }
      }, sentenceStructureData),
  ].reduce(
    (sentenceStructureData, f) => f(sentenceStructureData),
    createSentenceStructureDataFromWords({
      words: spacyParseResult.tokens.map((token) => token.text),
    }),
  );
}
