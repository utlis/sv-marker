import {
  coreSentenceElementAllowedSentenceElementNameOptions,
  sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap,
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
            const aStartWordIndex = findWordById(sentenceStructureDocument, {
              sentenceId: sentence.id,
              wordId: a.startWordId,
            })!.index;
            const aEndWordIndex = findWordById(sentenceStructureDocument, {
              sentenceId: sentence.id,
              wordId: a.endWordId,
            })!.index;
            const bStartWordIndex = findWordById(sentenceStructureDocument, {
              sentenceId: sentence.id,
              wordId: b.startWordId,
            })!.index;
            const bEndWordIndex = findWordById(sentenceStructureDocument, {
              sentenceId: sentence.id,
              wordId: b.endWordId,
            })!.index;
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
              const aStartWordIndex = findWordById(sentenceStructureDocument, {
                sentenceId: sentence.id,
                wordId: a.parts.at(0)!.startWordId,
              })!.index;
              const aEndWordIndex = findWordById(sentenceStructureDocument, {
                sentenceId: sentence.id,
                wordId: a.parts.at(-1)!.endWordId,
              })!.index;
              const bStartWordIndex = findWordById(sentenceStructureDocument, {
                sentenceId: sentence.id,
                wordId: b.parts.at(0)!.startWordId,
              })!.index;
              const bEndWordIndex = findWordById(sentenceStructureDocument, {
                sentenceId: sentence.id,
                wordId: b.parts.at(-1)!.endWordId,
              })!.index;
              if (aStartWordIndex !== bStartWordIndex) {
                return aStartWordIndex - bStartWordIndex;
              }
              return bEndWordIndex - aEndWordIndex;
            }),
        };
      }),
  };
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

export function findWordById(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; wordId: string },
): Word | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.words.find((word) => word.id === input.wordId) ?? null
  );
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
          | (typeof coreSentenceElementAllowedSentenceElementNameOptions)[number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "phrase";
        usage: "nominal" | "adjectival" | "adverbial";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["phrase"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "clause";
        usage: "nominal" | "adjectival" | "adverbial";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["clause"][number]
          | null;
      }
    | {
        sentenceId: string;
        kind: "sentence-constituent";
        type: "adverbial-phrase";
        startWordId: string;
        endWordId: string;
        sentenceElementName:
          | (typeof sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap)["adverbial-phrase"][number]
          | null;
      },
): Result<{
  newSentenceStructureDocument: SentenceStructureDocument;
  sentenceStructureElementId: string;
}> {
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
                  input.kind === "core-sentence-element"
                    ? ({
                        kind: "core-sentence-element",
                        id: sentenceStructureElementId,
                        startWordId: input.startWordId,
                        endWordId: input.endWordId,
                        sentenceElementName: input.sentenceElementName,
                      } satisfies SentenceStructureElement)
                    : input.type === "phrase" || input.type === "clause"
                      ? ({
                          kind: "sentence-constituent",
                          type: input.type,
                          usage: input.usage,
                          id: sentenceStructureElementId,
                          startWordId: input.startWordId,
                          endWordId: input.endWordId,
                          sentenceElementName: input.sentenceElementName,
                        } satisfies SentenceStructureElement)
                      : ({
                          kind: "sentence-constituent",
                          type: "adverbial-phrase",
                          id: sentenceStructureElementId,
                          startWordId: input.startWordId,
                          endWordId: input.endWordId,
                          sentenceElementName: input.sentenceElementName,
                        } satisfies SentenceStructureElement),
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

export function findSentenceStructureElementById(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; sentenceStructureElementId: string },
): SentenceStructureElement | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.sentenceStructureElements.find(
        (sentenceStructureElement) =>
          sentenceStructureElement.id === input.sentenceStructureElementId,
      ) ?? null
  );
}

export function findSentenceStructureElementByStartAndEndWordId(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; startWordId: string; endWordId: string },
): SentenceStructureElement | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.sentenceStructureElements.find(
        (sentenceStructureElement) =>
          sentenceStructureElement.startWordId === input.startWordId &&
          sentenceStructureElement.endWordId === input.endWordId,
      ) ?? null
  );
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
    const existingModifierSentenceStructureElement =
      findSentenceStructureElementByStartAndEndWordId(
        sentenceStructureDocument,
        {
          sentenceId: input.sentenceId,
          startWordId: input.modifierSentenceStructureElement.startWordId,
          endWordId: input.modifierSentenceStructureElement.endWordId,
        },
      );
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
      sentenceStructureElementId: sentenceStructureElementId,
    };
  })();

  const modifiedSentenceStructureElementResult: {
    newSentenceStructureDocument: SentenceStructureDocument;
    sentenceStructureElementId: string;
  } = (() => {
    const existingModifiedSentenceStructureElement =
      findSentenceStructureElementByStartAndEndWordId(
        modifierSentenceStructureElementResult.newSentenceStructureDocument,
        {
          sentenceId: input.sentenceId,
          startWordId: input.modifiedSentenceStructureElement.startWordId,
          endWordId: input.modifiedSentenceStructureElement.endWordId,
        },
      );
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

export function findModificationById(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; modificationId: string },
): Modification | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.modifications.find(
        (modification) => modification.id === input.modificationId,
      ) ?? null
  );
}

export function deleteModification(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; modificationId: string },
): SentenceStructureDocument {
  const newModifications =
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.modifications.filter(
        (modification) => modification.id !== input.modificationId,
      ) ?? null;
  if (newModifications === null) {
    return sentenceStructureDocument;
  }
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
                      .toSorted(
                        (a, b) =>
                          (findWordById(sentenceStructureDocument, {
                            sentenceId: sentence.id,
                            wordId: a.startWordId,
                          })?.index ?? -1) -
                          (findWordById(sentenceStructureDocument, {
                            sentenceId: sentence.id,
                            wordId: b.startWordId,
                          })?.index ?? -1),
                      )
                      .map(
                        (part, index) =>
                          ({
                            type: part.type,
                            id: crypto.randomUUID(),
                            index,
                            startWordId: part.startWordId,
                            endWordId: part.endWordId,
                          }) satisfies CoordinationPart,
                      ),
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

export function findCoordinationById(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; coordinationId: string },
): Coordination | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.coordinations.find(
        (coordination) => coordination.id === input.coordinationId,
      ) ?? null
  );
}

export function findCoordinationByStartAndEndWordId(
  sentenceStructureDocument: SentenceStructureDocument,
  input: { sentenceId: string; startWordId: string; endWordId: string },
): Coordination | null {
  return (
    sentenceStructureDocument.sentences
      .find((sentence) => sentence.id === input.sentenceId)
      ?.coordinations.find(
        (coordination) =>
          coordination.parts.at(0)!.startWordId === input.startWordId &&
          coordination.parts.at(-1)!.endWordId === input.endWordId,
      ) ?? null
  );
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
