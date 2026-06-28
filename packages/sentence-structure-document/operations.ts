import {
  allowedSentenceElementNameOptions,
  SentenceStructureDocumentSchema,
  type Coordination,
  type CoordinationPart,
  type CoordinationPartType,
  type Modification,
  type SentenceStructureDocument,
  type SentenceElementName,
  type SentenceStructureElement,
  type Word,
} from "./schema.js";
import {
  simplifiedSentenceStructureDocumentToSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "./codecs/simplified-codec.js";
import { jsonStringToSentenceStructureDocument } from "./codecs/json-codec.js";
import { xmlStringToSentenceStructureDocument } from "./codecs/xml-codec.js";
import type { SentenceStructureDocumentForest } from "./tree/types.js";
import { createSentenceStructureDocumentForest } from "./tree/create.js";
import type { SentenceStructureDecoratedDocumentForest } from "./tree/decorated/types.js";
import { createSentenceStructureDecoratedDocumentForest } from "./tree/decorated/create.js";

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export function normalizeSentenceStructureDocument(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureDocument {
  return {
    sentences: sentenceStructureDocument.sentences
      .toSorted((a, b) => a.index - b.index)
      .map((sentence) => {
        const normalizedSentenceStructureElements =
          sentence.sentenceStructureElements.toSorted((a, b) => {
            const aStartWordIndex = sentenceStructureDocument.sentences
              .find(
                (candidateSentence) => candidateSentence.id === sentence.id,
              )!
              .words.find((word) => word.id === a.startWordId)!.index;
            const aEndWordIndex = sentenceStructureDocument.sentences
              .find(
                (candidateSentence) => candidateSentence.id === sentence.id,
              )!
              .words.find((word) => word.id === a.endWordId)!.index;
            const bStartWordIndex = sentenceStructureDocument.sentences
              .find(
                (candidateSentence) => candidateSentence.id === sentence.id,
              )!
              .words.find((word) => word.id === b.startWordId)!.index;
            const bEndWordIndex = sentenceStructureDocument.sentences
              .find(
                (candidateSentence) => candidateSentence.id === sentence.id,
              )!
              .words.find((word) => word.id === b.endWordId)!.index;
            if (aStartWordIndex !== bStartWordIndex) {
              return aStartWordIndex - bStartWordIndex;
            }
            return bEndWordIndex - aEndWordIndex;
          });
        return {
          id: sentence.id,
          index: sentence.index,
          words: sentence.words.toSorted((a, b) => a.index - b.index),
          sentenceStructureElements: normalizedSentenceStructureElements,
          modifications: sentence.modifications.toSorted((a, b) => {
            const aModifierIndex =
              normalizedSentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  a.modifierSentenceStructureElementId,
              )!;
            const aModifiedIndex =
              normalizedSentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  a.modifiedSentenceStructureElementId,
              )!;
            const bModifierIndex =
              normalizedSentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  b.modifierSentenceStructureElementId,
              )!;
            const bModifiedIndex =
              normalizedSentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  b.modifiedSentenceStructureElementId,
              )!;
            if (aModifierIndex !== bModifierIndex) {
              return aModifierIndex - bModifierIndex;
            }
            return aModifiedIndex - bModifiedIndex;
          }),
          coordinations: sentence.coordinations
            .map((coordination) => ({
              ...coordination,
              parts: coordination.parts.toSorted((a, b) => a.index - b.index),
            }))
            .toSorted((a, b) => {
              const aStartWordIndex = sentenceStructureDocument.sentences
                .find(
                  (candidateSentence) => candidateSentence.id === sentence.id,
                )!
                .words.find(
                  (word) => word.id === a.parts.at(0)!.startWordId,
                )!.index;
              const aEndWordIndex = sentenceStructureDocument.sentences
                .find(
                  (candidateSentence) => candidateSentence.id === sentence.id,
                )!
                .words.find(
                  (word) => word.id === a.parts.at(-1)!.endWordId,
                )!.index;
              const bStartWordIndex = sentenceStructureDocument.sentences
                .find(
                  (candidateSentence) => candidateSentence.id === sentence.id,
                )!
                .words.find(
                  (word) => word.id === b.parts.at(0)!.startWordId,
                )!.index;
              const bEndWordIndex = sentenceStructureDocument.sentences
                .find(
                  (candidateSentence) => candidateSentence.id === sentence.id,
                )!
                .words.find(
                  (word) => word.id === b.parts.at(-1)!.endWordId,
                )!.index;
              if (aStartWordIndex !== bStartWordIndex) {
                return aStartWordIndex - bStartWordIndex;
              }
              return bEndWordIndex - aEndWordIndex;
            }),
        };
      }),
  };
}

export function createSentenceStructureDocumentFromText(
  text: string,
): SentenceStructureDocument {
  const sentenceSegmenter = new Intl.Segmenter("en-US", {
    granularity: "sentence",
  });
  const wordSegmenter = new Intl.Segmenter("en-US", { granularity: "word" });

  return createSentenceStructureDocumentFromWords(
    [...sentenceSegmenter.segment(text)]
      .map((sentenceSegment) => {
        const words: { text: string; whitespaceAfter: string }[] = [];

        for (const wordSegment of wordSegmenter.segment(
          sentenceSegment.segment,
        )) {
          if (wordSegment.segment.trim() === "") {
            if (words.length > 0) {
              words.at(-1)!.whitespaceAfter += wordSegment.segment;
            }
            continue;
          }

          words.push({
            text: wordSegment.segment,
            whitespaceAfter: "",
          });
        }

        if (words.length === 0) {
          return null;
        }

        return { words };
      })
      .filter((sentence) => sentence !== null),
  );
}

export function createSentenceStructureDocumentFromWords(
  sentences: {
    words: {
      text: string;
      whitespaceAfter: string;
    }[];
  }[],
): SentenceStructureDocument {
  return SentenceStructureDocumentSchema.parse({
    sentences: sentences.map((sentence, index) => ({
      id: crypto.randomUUID(),
      index,
      words: sentence.words.map((word, index) => ({
        id: crypto.randomUUID(),
        index,
        text: word.text,
        whitespaceAfter: word.whitespaceAfter,
      })),
      sentenceStructureElements: [],
      modifications: [],
      coordinations: [],
    })),
  } satisfies SentenceStructureDocument);
}

export function createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
  simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument,
): SentenceStructureDocument {
  return simplifiedSentenceStructureDocumentToSentenceStructureDocument.decode(
    simplifiedSentenceStructureDocument,
  );
}

export function createSentenceStructureDocumentFromJSONString(
  jsonString: string,
): Result<{ newSentenceStructureDocument: SentenceStructureDocument }> {
  const newSentenceStructureDocument =
    jsonStringToSentenceStructureDocument.safeDecode(jsonString);

  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function createSentenceStructureDocumentFromXMLString(
  xmlString: string,
): Result<{ newSentenceStructureDocument: SentenceStructureDocument }> {
  const newSentenceStructureDocument =
    xmlStringToSentenceStructureDocument.safeDecode(xmlString);

  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function sentenceStructureDocumentToText(
  sentenceStructureDocument: SentenceStructureDocument,
): string {
  return sentenceStructureDocument.sentences
    .map((sentence) =>
      sentence.words.map((word) => word.text + word.whitespaceAfter).join(""),
    )
    .join("");
}

export function sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
  sentenceStructureDocument: SentenceStructureDocument,
): SimplifiedSentenceStructureDocument {
  return simplifiedSentenceStructureDocumentToSentenceStructureDocument.encode(
    sentenceStructureDocument,
  );
}

export function sentenceStructureDocumentToJSONString(
  sentenceStructureDocument: SentenceStructureDocument,
): string {
  return jsonStringToSentenceStructureDocument.encode(
    sentenceStructureDocument,
  );
}

export function sentenceStructureDocumentToXMLString(
  sentenceStructureDocument: SentenceStructureDocument,
): string {
  return xmlStringToSentenceStructureDocument.encode(sentenceStructureDocument);
}

export function sentenceStructureDocumentToSentenceStructureDocumentForest(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureDocumentForest {
  return createSentenceStructureDocumentForest(sentenceStructureDocument);
}

export function sentenceStructureDocumentToSentenceStructureDecoratedDocumentForest(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureDecoratedDocumentForest {
  return createSentenceStructureDecoratedDocumentForest(
    createSentenceStructureDocumentForest(sentenceStructureDocument),
  );
}

export function updateSentenceStructureDocumentText(
  sentenceStructureDocument: SentenceStructureDocument,
  newText: string,
): SentenceStructureDocument {
  const oldSentenceStructureDocument = sentenceStructureDocument;
  const newSentenceStructureDocument =
    createSentenceStructureDocumentFromText(newText);

  const oldWordIdToNewWordWithSentenceId = (() => {
    const oldComparableWordTextsBySentence =
      oldSentenceStructureDocument.sentences.map((sentence) =>
        sentence.words.map((word) =>
          word.text.normalize().toLocaleLowerCase("en-US"),
        ),
      );
    const newComparableWordTextsBySentence =
      newSentenceStructureDocument.sentences.map((sentence) =>
        sentence.words.map((word) =>
          word.text.normalize().toLocaleLowerCase("en-US"),
        ),
      );

    const matchedSentenceIndexPairs = (() => {
      const sentencePairMatchLengthTable = oldComparableWordTextsBySentence.map(
        (oldComparableWordTexts) =>
          newComparableWordTextsBySentence.map((newComparableWordTexts) => {
            const wordMatchLengthTable = Array.from(
              { length: oldComparableWordTexts.length + 1 },
              () =>
                Array.from(
                  { length: newComparableWordTexts.length + 1 },
                  () => 0,
                ),
            );

            for (
              let oldWordIndex = oldComparableWordTexts.length - 1;
              oldWordIndex >= 0;
              oldWordIndex--
            ) {
              for (
                let newWordIndex = newComparableWordTexts.length - 1;
                newWordIndex >= 0;
                newWordIndex--
              ) {
                if (
                  oldComparableWordTexts[oldWordIndex] ===
                  newComparableWordTexts[newWordIndex]
                ) {
                  wordMatchLengthTable[oldWordIndex]![newWordIndex] =
                    wordMatchLengthTable[oldWordIndex + 1]![newWordIndex + 1]! +
                    1;
                } else {
                  wordMatchLengthTable[oldWordIndex]![newWordIndex] = Math.max(
                    wordMatchLengthTable[oldWordIndex + 1]![newWordIndex]!,
                    wordMatchLengthTable[oldWordIndex]![newWordIndex + 1]!,
                  );
                }
              }
            }

            return wordMatchLengthTable[0]![0]!;
          }),
      );

      const sentenceAlignmentScoreTable = Array.from(
        { length: oldSentenceStructureDocument.sentences.length + 1 },
        () =>
          Array.from(
            { length: newSentenceStructureDocument.sentences.length + 1 },
            () => 0,
          ),
      );

      for (
        let oldSentenceIndex =
          oldSentenceStructureDocument.sentences.length - 1;
        oldSentenceIndex >= 0;
        oldSentenceIndex--
      ) {
        for (
          let newSentenceIndex =
            newSentenceStructureDocument.sentences.length - 1;
          newSentenceIndex >= 0;
          newSentenceIndex--
        ) {
          sentenceAlignmentScoreTable[oldSentenceIndex]![newSentenceIndex] =
            Math.max(
              sentenceAlignmentScoreTable[oldSentenceIndex + 1]![
                newSentenceIndex
              ]!,
              sentenceAlignmentScoreTable[oldSentenceIndex]![
                newSentenceIndex + 1
              ]!,
              sentenceAlignmentScoreTable[oldSentenceIndex + 1]![
                newSentenceIndex + 1
              ]! +
                sentencePairMatchLengthTable[oldSentenceIndex]![
                  newSentenceIndex
                ]!,
            );
        }
      }

      const matchedSentenceIndexPairs: {
        oldSentenceIndex: number;
        newSentenceIndex: number;
      }[] = [];
      let oldSentenceIndex = 0;
      let newSentenceIndex = 0;
      while (
        oldSentenceIndex < oldSentenceStructureDocument.sentences.length &&
        newSentenceIndex < newSentenceStructureDocument.sentences.length
      ) {
        if (
          sentenceAlignmentScoreTable[oldSentenceIndex]![newSentenceIndex]! ===
          sentenceAlignmentScoreTable[oldSentenceIndex]![newSentenceIndex + 1]!
        ) {
          newSentenceIndex++;
        } else if (
          sentenceAlignmentScoreTable[oldSentenceIndex]![newSentenceIndex]! ===
          sentenceAlignmentScoreTable[oldSentenceIndex + 1]![newSentenceIndex]!
        ) {
          oldSentenceIndex++;
        } else if (
          sentenceAlignmentScoreTable[oldSentenceIndex]![newSentenceIndex]! ===
          sentenceAlignmentScoreTable[oldSentenceIndex + 1]![
            newSentenceIndex + 1
          ]!
        ) {
          oldSentenceIndex++;
          newSentenceIndex++;
        } else {
          matchedSentenceIndexPairs.push({
            oldSentenceIndex,
            newSentenceIndex,
          });
          oldSentenceIndex++;
          newSentenceIndex++;
        }
      }

      return matchedSentenceIndexPairs;
    })();

    const oldWordIdToNewWordWithSentenceId = new Map<
      string,
      {
        sentenceId: string;
        word: Word;
      }
    >();
    for (const {
      oldSentenceIndex,
      newSentenceIndex,
    } of matchedSentenceIndexPairs) {
      const oldSentence =
        oldSentenceStructureDocument.sentences[oldSentenceIndex]!;
      const newSentence =
        newSentenceStructureDocument.sentences[newSentenceIndex]!;
      const oldComparableWordTexts =
        oldComparableWordTextsBySentence[oldSentenceIndex]!;
      const newComparableWordTexts =
        newComparableWordTextsBySentence[newSentenceIndex]!;
      const wordMatchLengthTable = (() => {
        const wordMatchLengthTable = Array.from(
          { length: oldSentence.words.length + 1 },
          () => Array.from({ length: newSentence.words.length + 1 }, () => 0),
        );

        for (
          let oldWordIndex = oldSentence.words.length - 1;
          oldWordIndex >= 0;
          oldWordIndex--
        ) {
          for (
            let newWordIndex = newSentence.words.length - 1;
            newWordIndex >= 0;
            newWordIndex--
          ) {
            if (
              oldComparableWordTexts[oldWordIndex] ===
              newComparableWordTexts[newWordIndex]
            ) {
              wordMatchLengthTable[oldWordIndex]![newWordIndex] =
                wordMatchLengthTable[oldWordIndex + 1]![newWordIndex + 1]! + 1;
            } else {
              wordMatchLengthTable[oldWordIndex]![newWordIndex] = Math.max(
                wordMatchLengthTable[oldWordIndex + 1]![newWordIndex]!,
                wordMatchLengthTable[oldWordIndex]![newWordIndex + 1]!,
              );
            }
          }
        }

        return wordMatchLengthTable;
      })();

      let oldWordIndex = 0;
      let newWordIndex = 0;
      while (
        oldWordIndex < oldSentence.words.length &&
        newWordIndex < newSentence.words.length
      ) {
        if (
          wordMatchLengthTable[oldWordIndex]![newWordIndex]! ===
          wordMatchLengthTable[oldWordIndex]![newWordIndex + 1]!
        ) {
          newWordIndex++;
        } else if (
          wordMatchLengthTable[oldWordIndex]![newWordIndex]! ===
          wordMatchLengthTable[oldWordIndex + 1]![newWordIndex]!
        ) {
          oldWordIndex++;
        } else {
          oldWordIdToNewWordWithSentenceId.set(
            oldSentence.words[oldWordIndex]!.id,
            {
              sentenceId: newSentence.id,
              word: newSentence.words[newWordIndex]!,
            },
          );
          oldWordIndex++;
          newWordIndex++;
        }
      }
    }

    return oldWordIdToNewWordWithSentenceId;
  })();

  const newSentenceStructureDocumentWithSentenceStructureElements =
    oldSentenceStructureDocument.sentences
      .flatMap((sentence) => sentence.sentenceStructureElements)
      .reduce((currentSentenceStructureDocument, sentenceStructureElement) => {
        {
          if (sentenceStructureElement.kind === "modification-element") {
            return currentSentenceStructureDocument;
          }

          const newStartWordWithSentenceId =
            oldWordIdToNewWordWithSentenceId.get(
              sentenceStructureElement.startWordId,
            );
          const newEndWordWithSentenceId = oldWordIdToNewWordWithSentenceId.get(
            sentenceStructureElement.endWordId,
          );
          if (
            !newStartWordWithSentenceId ||
            !newEndWordWithSentenceId ||
            newStartWordWithSentenceId.sentenceId !==
              newEndWordWithSentenceId.sentenceId ||
            newStartWordWithSentenceId.word.index >
              newEndWordWithSentenceId.word.index
          ) {
            return currentSentenceStructureDocument;
          }

          const result = addSentenceStructureElement(
            currentSentenceStructureDocument,
            {
              ...sentenceStructureElement,
              sentenceId: newStartWordWithSentenceId.sentenceId,
              startWordId: newStartWordWithSentenceId.word.id,
              endWordId: newEndWordWithSentenceId.word.id,
            },
          );
          if (result.success) {
            return result.data.newSentenceStructureDocument;
          } else {
            return currentSentenceStructureDocument;
          }
        }
      }, newSentenceStructureDocument);

  const newSentenceStructureDocumentWithModifications =
    oldSentenceStructureDocument.sentences
      .flatMap((sentence) =>
        sentence.modifications.map((modification) => ({
          sentence,
          modification,
        })),
      )
      .reduce(
        (currentSentenceStructureDocument, { sentence, modification }) => {
          {
            const modifierSentenceStructureElement =
              sentence.sentenceStructureElements.find(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  modification.modifierSentenceStructureElementId,
              );
            const modifiedSentenceStructureElement =
              sentence.sentenceStructureElements.find(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  modification.modifiedSentenceStructureElementId,
              );
            if (
              !modifierSentenceStructureElement ||
              !modifiedSentenceStructureElement
            ) {
              throw new Error("Sentence structure element not found");
            }

            const newModifierSentenceStructureElementStartWordWithSentenceId =
              oldWordIdToNewWordWithSentenceId.get(
                modifierSentenceStructureElement.startWordId,
              );
            const newModifierSentenceStructureElementEndWordWithSentenceId =
              oldWordIdToNewWordWithSentenceId.get(
                modifierSentenceStructureElement.endWordId,
              );
            const newModifiedSentenceStructureElementStartWordWithSentenceId =
              oldWordIdToNewWordWithSentenceId.get(
                modifiedSentenceStructureElement.startWordId,
              );
            const newModifiedSentenceStructureElementEndWordWithSentenceId =
              oldWordIdToNewWordWithSentenceId.get(
                modifiedSentenceStructureElement.endWordId,
              );
            if (
              !newModifierSentenceStructureElementStartWordWithSentenceId ||
              !newModifierSentenceStructureElementEndWordWithSentenceId ||
              !newModifiedSentenceStructureElementStartWordWithSentenceId ||
              !newModifiedSentenceStructureElementEndWordWithSentenceId ||
              newModifierSentenceStructureElementStartWordWithSentenceId.sentenceId !==
                newModifierSentenceStructureElementEndWordWithSentenceId.sentenceId ||
              newModifierSentenceStructureElementStartWordWithSentenceId.sentenceId !==
                newModifiedSentenceStructureElementStartWordWithSentenceId.sentenceId ||
              newModifiedSentenceStructureElementStartWordWithSentenceId.sentenceId !==
                newModifiedSentenceStructureElementEndWordWithSentenceId.sentenceId ||
              newModifierSentenceStructureElementStartWordWithSentenceId.word
                .index >
                newModifierSentenceStructureElementEndWordWithSentenceId.word
                  .index ||
              newModifiedSentenceStructureElementStartWordWithSentenceId.word
                .index >
                newModifiedSentenceStructureElementEndWordWithSentenceId.word
                  .index
            ) {
              return currentSentenceStructureDocument;
            }

            const result = addModification(currentSentenceStructureDocument, {
              sentenceId:
                newModifierSentenceStructureElementStartWordWithSentenceId.sentenceId,
              modifierSentenceStructureElement: {
                startWordId:
                  newModifierSentenceStructureElementStartWordWithSentenceId
                    .word.id,
                endWordId:
                  newModifierSentenceStructureElementEndWordWithSentenceId.word
                    .id,
              },
              modifiedSentenceStructureElement: {
                startWordId:
                  newModifiedSentenceStructureElementStartWordWithSentenceId
                    .word.id,
                endWordId:
                  newModifiedSentenceStructureElementEndWordWithSentenceId.word
                    .id,
              },
            });
            if (result.success) {
              return result.data.newSentenceStructureDocument;
            } else {
              return currentSentenceStructureDocument;
            }
          }
        },
        newSentenceStructureDocumentWithSentenceStructureElements,
      );

  const newSentenceStructureDocumentWithCoordinations =
    oldSentenceStructureDocument.sentences
      .flatMap((sentence) => sentence.coordinations)
      .reduce((currentSentenceStructureDocument, coordination) => {
        {
          const newCoordinationPartsWithSentenceId = coordination.parts
            .map((coordinationPart) => {
              const newStartWordWithSentenceId =
                oldWordIdToNewWordWithSentenceId.get(
                  coordinationPart.startWordId,
                );
              const newEndWordWithSentenceId =
                oldWordIdToNewWordWithSentenceId.get(
                  coordinationPart.endWordId,
                );
              if (
                !newStartWordWithSentenceId ||
                !newEndWordWithSentenceId ||
                newStartWordWithSentenceId.sentenceId !==
                  newEndWordWithSentenceId.sentenceId ||
                newStartWordWithSentenceId.word.index >
                  newEndWordWithSentenceId.word.index
              ) {
                return null;
              }
              return {
                type: coordinationPart.type,
                sentenceId: newStartWordWithSentenceId.sentenceId,
                startWordId: newStartWordWithSentenceId.word.id,
                endWordId: newEndWordWithSentenceId.word.id,
              };
            })
            .filter((coordinationPart) => coordinationPart !== null);

          const sentenceId =
            newCoordinationPartsWithSentenceId.at(0)?.sentenceId;
          if (
            !sentenceId ||
            newCoordinationPartsWithSentenceId.length !==
              coordination.parts.length ||
            newCoordinationPartsWithSentenceId.some(
              (coordinationPart) => coordinationPart.sentenceId !== sentenceId,
            )
          ) {
            return currentSentenceStructureDocument;
          }

          const result = addCoordination(currentSentenceStructureDocument, {
            sentenceId,
            coordinationParts: newCoordinationPartsWithSentenceId.map(
              (coordinationPart) => ({
                type: coordinationPart.type,
                startWordId: coordinationPart.startWordId,
                endWordId: coordinationPart.endWordId,
              }),
            ),
          });
          if (result.success) {
            return result.data.newSentenceStructureDocument;
          } else {
            return currentSentenceStructureDocument;
          }
        }
      }, newSentenceStructureDocumentWithModifications);

  return normalizeSentenceStructureDocument(
    newSentenceStructureDocumentWithCoordinations,
  );
}

export function clearSentenceStructureAnnotations(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureDocument {
  return SentenceStructureDocumentSchema.parse({
    sentences: sentenceStructureDocument.sentences.map((sentence) => ({
      id: sentence.id,
      index: sentence.index,
      words: sentence.words,
      sentenceStructureElements: [],
      modifications: [],
      coordinations: [],
    })),
  } satisfies SentenceStructureDocument);
}

export function addSentenceStructureElement(
  sentenceStructureDocument: SentenceStructureDocument,
  input:
    | {
        sentenceId: string;
        kind: "core-sentence-element";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["core-sentence-element"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "verbal-phrase";
        usage: "nominal";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["verbal-phrase"]["nominal"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "verbal-phrase";
        usage: "adjectival";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["verbal-phrase"]["adjectival"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "verbal-phrase";
        usage: "adverbial";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["verbal-phrase"]["adverbial"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "clause";
        usage: "nominal";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["clause"]["nominal"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "clause";
        usage: "adjectival";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["clause"]["adjectival"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "clause";
        usage: "adverbial";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["clause"]["adverbial"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "modifier-phrase";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof allowedSentenceElementNameOptions)["sentence-constituent"]["modifier-phrase"][number]
          | null;
      },
): Result<{
  newSentenceStructureDocument: SentenceStructureDocument;
  sentenceStructureElementId: string;
}> {
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === input.sentenceId,
  );
  if (!sentence) {
    throw new Error("Sentence not found");
  }
  const sentenceStructureElementId = crypto.randomUUID();
  const newSentenceStructureDocument =
    SentenceStructureDocumentSchema.safeParse(
      normalizeSentenceStructureDocument({
        sentences: sentenceStructureDocument.sentences.map((sentence) =>
          sentence.id === input.sentenceId
            ? {
                ...sentence,
                sentenceStructureElements: [
                  ...sentence.sentenceStructureElements,
                  (() => {
                    switch (input.kind) {
                      case "core-sentence-element": {
                        return {
                          kind: "core-sentence-element",
                          id: sentenceStructureElementId,
                          startWordId: input.startWordId,
                          endWordId: input.endWordId,
                          sentenceElementName: input.sentenceElementName,
                        } satisfies SentenceStructureElement;
                      }
                      case "sentence-constituent": {
                        switch (input.type) {
                          case "verbal-phrase": {
                            switch (input.usage) {
                              case "nominal": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              case "adjectival": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              case "adverbial": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              default: {
                                input satisfies never;
                                throw new Error("Unreachable");
                              }
                            }
                          }
                          case "clause": {
                            switch (input.usage) {
                              case "nominal": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              case "adjectival": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              case "adverbial": {
                                return {
                                  kind: "sentence-constituent",
                                  type: input.type,
                                  usage: input.usage,
                                  id: sentenceStructureElementId,
                                  startWordId: input.startWordId,
                                  endWordId: input.endWordId,
                                  sentenceElementName:
                                    input.sentenceElementName,
                                } satisfies SentenceStructureElement;
                              }
                              default: {
                                input satisfies never;
                                throw new Error("Unreachable");
                              }
                            }
                          }
                          case "modifier-phrase": {
                            return {
                              kind: "sentence-constituent",
                              type: "modifier-phrase",
                              id: sentenceStructureElementId,
                              startWordId: input.startWordId,
                              endWordId: input.endWordId,
                              sentenceElementName: input.sentenceElementName,
                            } satisfies SentenceStructureElement;
                          }
                          default: {
                            input satisfies never;
                            throw new Error("Unreachable");
                          }
                        }
                      }
                      default: {
                        input satisfies never;
                        throw new Error("Unreachable");
                      }
                    }
                  })(),
                ] satisfies SentenceStructureElement[],
              }
            : sentence,
        ),
      }),
    );

  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
        sentenceStructureElementId: sentenceStructureElementId,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureDocument.error;
}

export function updateSentenceElementName(
  sentenceStructureDocument: SentenceStructureDocument,
  input: {
    sentenceId: string;
    sentenceStructureElementId: string;
    sentenceElementName: SentenceElementName | null;
  },
): Result<{ newSentenceStructureDocument: SentenceStructureDocument }> {
  const newSentenceStructureDocument =
    SentenceStructureDocumentSchema.safeParse(
      normalizeSentenceStructureDocument({
        sentences: sentenceStructureDocument.sentences.map((sentence) =>
          sentence.id === input.sentenceId
            ? {
                ...sentence,
                sentenceStructureElements:
                  sentence.sentenceStructureElements.map(
                    (sentenceStructureElement) =>
                      sentenceStructureElement.id ===
                      input.sentenceStructureElementId
                        ? ({
                            ...sentenceStructureElement,
                            sentenceElementName: input.sentenceElementName,
                          } as SentenceStructureElement)
                        : sentenceStructureElement,
                  ),
              }
            : sentence,
        ),
      }),
    );

  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureDocument.error;
}

export function deleteSentenceStructureElement(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; sentenceStructureElementId: string },
): SentenceStructureDocument {
  return SentenceStructureDocumentSchema.parse(
    normalizeSentenceStructureDocument({
      sentences: sentenceStructureDocument.sentences.map((sentence) =>
        sentence.id === input.sentenceId
          ? {
              ...sentence,
              sentenceStructureElements:
                sentence.sentenceStructureElements.filter(
                  (sentenceStructureElement) =>
                    sentenceStructureElement.id !==
                    input.sentenceStructureElementId,
                ),
              modifications: sentence.modifications.filter(
                (modification) =>
                  modification.modifierSentenceStructureElementId !==
                    input.sentenceStructureElementId &&
                  modification.modifiedSentenceStructureElementId !==
                    input.sentenceStructureElementId,
              ),
            }
          : sentence,
      ),
    }),
  );
}

export function addModification(
  sentenceStructureDocument: SentenceStructureDocument,
  input: {
    sentenceId: string;
    modifierSentenceStructureElement: {
      startWordId: string;
      endWordId: string;
    };
    modifiedSentenceStructureElement: {
      startWordId: string;
      endWordId: string;
    };
  },
): Result<{ newSentenceStructureDocument: SentenceStructureDocument }> {
  const modifierSentenceStructureElementResult: {
    newSentenceStructureDocument: SentenceStructureDocument;
    sentenceStructureElementId: string;
  } = (() => {
    const sentence = sentenceStructureDocument.sentences.find(
      (sentence) => sentence.id === input.sentenceId,
    );
    if (!sentence) {
      throw new Error("Sentence not found");
    }

    const existingModifierSentenceStructureElement =
      sentence.sentenceStructureElements.find(
        (sentenceStructureElement) =>
          sentenceStructureElement.startWordId ===
            input.modifierSentenceStructureElement.startWordId &&
          sentenceStructureElement.endWordId ===
            input.modifierSentenceStructureElement.endWordId,
      ) ?? null;
    if (existingModifierSentenceStructureElement) {
      return {
        newSentenceStructureDocument: sentenceStructureDocument,
        sentenceStructureElementId: existingModifierSentenceStructureElement.id,
      };
    }

    const sentenceStructureElementId = crypto.randomUUID();
    return {
      newSentenceStructureDocument: {
        sentences: sentenceStructureDocument.sentences.map((sentence) =>
          sentence.id === input.sentenceId
            ? {
                ...sentence,
                sentenceStructureElements: [
                  ...sentence.sentenceStructureElements,
                  {
                    kind: "modification-element",
                    id: sentenceStructureElementId,
                    startWordId:
                      input.modifierSentenceStructureElement.startWordId,
                    endWordId: input.modifierSentenceStructureElement.endWordId,
                  } satisfies SentenceStructureElement,
                ],
              }
            : sentence,
        ),
      } satisfies SentenceStructureDocument,
      sentenceStructureElementId,
    };
  })();

  const modifiedSentenceStructureElementResult: {
    newSentenceStructureDocument: SentenceStructureDocument;
    sentenceStructureElementId: string;
  } = (() => {
    const sentence =
      modifierSentenceStructureElementResult.newSentenceStructureDocument.sentences.find(
        (sentence) => sentence.id === input.sentenceId,
      );
    if (!sentence) {
      throw new Error("Sentence not found");
    }

    const existingModifiedSentenceStructureElement =
      sentence.sentenceStructureElements.find(
        (sentenceStructureElement) =>
          sentenceStructureElement.startWordId ===
            input.modifiedSentenceStructureElement.startWordId &&
          sentenceStructureElement.endWordId ===
            input.modifiedSentenceStructureElement.endWordId,
      ) ?? null;
    if (existingModifiedSentenceStructureElement) {
      return {
        newSentenceStructureDocument:
          modifierSentenceStructureElementResult.newSentenceStructureDocument,
        sentenceStructureElementId: existingModifiedSentenceStructureElement.id,
      };
    }

    const sentenceStructureElementId = crypto.randomUUID();
    return {
      newSentenceStructureDocument: {
        sentences:
          modifierSentenceStructureElementResult.newSentenceStructureDocument.sentences.map(
            (sentence) =>
              sentence.id === input.sentenceId
                ? {
                    ...sentence,
                    sentenceStructureElements: [
                      ...sentence.sentenceStructureElements,
                      {
                        kind: "modification-element",
                        id: sentenceStructureElementId,
                        startWordId:
                          input.modifiedSentenceStructureElement.startWordId,
                        endWordId:
                          input.modifiedSentenceStructureElement.endWordId,
                      } satisfies SentenceStructureElement,
                    ],
                  }
                : sentence,
          ),
      } satisfies SentenceStructureDocument,
      sentenceStructureElementId,
    };
  })();

  const newSentenceStructureDocument =
    SentenceStructureDocumentSchema.safeParse(
      normalizeSentenceStructureDocument({
        sentences:
          modifiedSentenceStructureElementResult.newSentenceStructureDocument.sentences.map(
            (sentence) =>
              sentence.id === input.sentenceId
                ? {
                    ...sentence,
                    modifications: [
                      ...sentence.modifications,
                      {
                        id: crypto.randomUUID(),
                        modifierSentenceStructureElementId:
                          modifierSentenceStructureElementResult.sentenceStructureElementId,
                        modifiedSentenceStructureElementId:
                          modifiedSentenceStructureElementResult.sentenceStructureElementId,
                      } satisfies Modification,
                    ],
                  }
                : sentence,
          ),
      }),
    );
  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureDocument.error;
}

export function deleteModification(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; modificationId: string },
): SentenceStructureDocument {
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === input.sentenceId,
  );
  if (!sentence) {
    throw new Error("Sentence not found");
  }

  const newModifications = sentence.modifications.filter(
    (modification) => modification.id !== input.modificationId,
  );
  return SentenceStructureDocumentSchema.parse(
    normalizeSentenceStructureDocument({
      sentences: sentenceStructureDocument.sentences.map((sentence) =>
        sentence.id === input.sentenceId
          ? {
              ...sentence,
              sentenceStructureElements:
                sentence.sentenceStructureElements.filter(
                  (sentenceStructureElement) =>
                    sentenceStructureElement.kind !== "modification-element" ||
                    newModifications.some(
                      (modification) =>
                        modification.modifierSentenceStructureElementId ===
                          sentenceStructureElement.id ||
                        modification.modifiedSentenceStructureElementId ===
                          sentenceStructureElement.id,
                    ),
                ),
              modifications: newModifications,
            }
          : sentence,
      ),
    }),
  );
}

export function addCoordination(
  sentenceStructureDocument: SentenceStructureDocument,
  input: {
    sentenceId: string;
    coordinationParts: {
      type: CoordinationPartType;
      startWordId: string;
      endWordId: string;
    }[];
  },
): Result<{
  newSentenceStructureDocument: SentenceStructureDocument;
}> {
  const newSentenceStructureDocument =
    SentenceStructureDocumentSchema.safeParse(
      normalizeSentenceStructureDocument({
        sentences: sentenceStructureDocument.sentences.map((sentence) =>
          sentence.id === input.sentenceId
            ? {
                ...sentence,
                coordinations: [
                  ...sentence.coordinations,
                  {
                    id: crypto.randomUUID(),
                    parts: input.coordinationParts
                      .toSorted((a, b) => {
                        const aStartWordIndex = sentence.words.find(
                          (word) => word.id === a.startWordId,
                        )!.index;
                        const bStartWordIndex = sentence.words.find(
                          (word) => word.id === b.startWordId,
                        )!.index;
                        return aStartWordIndex - bStartWordIndex;
                      })
                      .map((part, index) => {
                        return {
                          type: part.type,
                          id: crypto.randomUUID(),
                          index,
                          startWordId: part.startWordId,
                          endWordId: part.endWordId,
                        } satisfies CoordinationPart;
                      }),
                  } satisfies Coordination,
                ],
              }
            : sentence,
        ),
      }),
    );
  if (newSentenceStructureDocument.success) {
    return {
      success: true,
      data: {
        newSentenceStructureDocument: newSentenceStructureDocument.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureDocument.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureDocument.error;
}

export function deleteCoordination(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; coordinationId: string },
): SentenceStructureDocument {
  return SentenceStructureDocumentSchema.parse(
    normalizeSentenceStructureDocument({
      sentences: sentenceStructureDocument.sentences.map((sentence) =>
        sentence.id === input.sentenceId
          ? {
              ...sentence,
              coordinations: sentence.coordinations.filter(
                (coordination) => coordination.id !== input.coordinationId,
              ),
            }
          : sentence,
      ),
    }),
  );
}
