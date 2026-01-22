import type {
  Coordination,
  CoordinationPart,
  Sentence,
  SentenceStructureDocument,
  SentenceStructureElement,
  Word,
} from "../schema.js";
import {
  findCoordinationByStartAndEndWordId,
  findSentenceStructureElementByStartAndEndWordId,
  findWordById,
} from "../operations.js";
import type {
  SentenceStructureDocumentCoordinationNode,
  SentenceStructureDocumentCoordinationPartNode,
  SentenceStructureDocumentRootNode,
  SentenceStructureDocumentSentenceStructureElementNode,
  SentenceStructureDocumentForest,
  SentenceStructureDocumentWordNode,
  SentenceStructureDocumentSentenceTree,
} from "./types.js";

function createSentenceStructureDocumentWordNode(
  word: Word,
): SentenceStructureDocumentWordNode {
  return {
    type: "word",
    word,
  };
}

function _createSpanChildren(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceId: string,
  span: {
    startWordId: string;
    endWordId: string;
  },
): (
  | SentenceStructureDocumentWordNode
  | SentenceStructureDocumentSentenceStructureElementNode
  | SentenceStructureDocumentCoordinationNode
)[] {
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === sentenceId,
  );
  if (!sentence) {
    throw new Error("Invalid sentenceId");
  }
  const children: (
    | SentenceStructureDocumentWordNode
    | SentenceStructureDocumentSentenceStructureElementNode
    | SentenceStructureDocumentCoordinationNode
  )[] = [];

  const spanStartWordIndex = findWordById(sentenceStructureDocument, {
    sentenceId,
    wordId: span.startWordId,
  })!.index;
  const spanEndWordIndex = findWordById(sentenceStructureDocument, {
    sentenceId,
    wordId: span.endWordId,
  })!.index;
  let currentWordIndex = spanStartWordIndex;
  while (currentWordIndex <= spanEndWordIndex) {
    const matchedSentenceStructureElement =
      sentence.sentenceStructureElements
        .filter(
          (sentenceStructureElement) =>
            !(
              sentenceStructureElement.startWordId === span.startWordId &&
              sentenceStructureElement.endWordId === span.endWordId
            ),
        )
        .filter((sentenceStructureElement) => {
          const sentenceStructureElementStartWordIndex = findWordById(
            sentenceStructureDocument,
            {
              sentenceId,
              wordId: sentenceStructureElement.startWordId,
            },
          )!.index;
          const sentenceStructureElementEndWordIndex = findWordById(
            sentenceStructureDocument,
            {
              sentenceId,
              wordId: sentenceStructureElement.endWordId,
            },
          )!.index;
          return (
            sentenceStructureElementStartWordIndex === currentWordIndex &&
            sentenceStructureElementEndWordIndex <= spanEndWordIndex
          );
        })
        .sort((a, b) => {
          const aEndWordIndex = findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: a.endWordId,
          })!.index;
          const bEndWordIndex = findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: b.endWordId,
          })!.index;
          return bEndWordIndex - aEndWordIndex;
        })
        .at(0) ?? null;
    const matchedCoordination =
      sentence.coordinations
        .filter(
          (coordination) =>
            !(
              coordination.parts.at(0)!.startWordId === span.startWordId &&
              coordination.parts.at(-1)!.endWordId === span.endWordId
            ),
        )
        .filter((coordination) => {
          const coordinationStartWordIndex = findWordById(
            sentenceStructureDocument,
            {
              sentenceId,
              wordId: coordination.parts.at(0)!.startWordId,
            },
          )!.index;
          const coordinationEndWordIndex = findWordById(
            sentenceStructureDocument,
            {
              sentenceId,
              wordId: coordination.parts.at(-1)!.endWordId,
            },
          )!.index;
          return (
            coordinationStartWordIndex === currentWordIndex &&
            coordinationEndWordIndex <= spanEndWordIndex
          );
        })
        .sort((a, b) => {
          const aEndWordIndex = findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: a.parts.at(-1)!.endWordId,
          })!.index;
          const bEndWordIndex = findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: b.parts.at(-1)!.endWordId,
          })!.index;
          return bEndWordIndex - aEndWordIndex;
        })
        .at(0) ?? null;
    const matchedSentenceStructureElementEndWordIndex =
      matchedSentenceStructureElement
        ? findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: matchedSentenceStructureElement.endWordId,
          })!.index
        : -1;
    const matchedCoordinationEndWordIndex = matchedCoordination
      ? findWordById(sentenceStructureDocument, {
          sentenceId,
          wordId: matchedCoordination.parts.at(-1)!.endWordId,
        })!.index
      : -1;
    if (!matchedSentenceStructureElement && !matchedCoordination) {
      children.push(
        createSentenceStructureDocumentWordNode(
          sentence.words.find((word) => word.index === currentWordIndex)!,
        ),
      );
      currentWordIndex++;
    } else if (
      (matchedSentenceStructureElement && !matchedCoordination) ||
      (matchedSentenceStructureElement &&
        matchedCoordination &&
        matchedCoordinationEndWordIndex <=
          matchedSentenceStructureElementEndWordIndex)
    ) {
      children.push(
        createSentenceStructureDocumentSentenceStructureElementNode(
          sentenceStructureDocument,
          sentenceId,
          matchedSentenceStructureElement,
        ),
      );
      currentWordIndex = matchedSentenceStructureElementEndWordIndex + 1;
    } else {
      if (!matchedCoordination) throw new Error("Unreachable");
      children.push(
        createSentenceStructureDocumentCoordinationNode(
          sentenceStructureDocument,
          sentenceId,
          matchedCoordination,
        ),
      );
      currentWordIndex = matchedCoordinationEndWordIndex + 1;
    }
  }

  return children;
}

function createSentenceStructureDocumentSentenceStructureElementNode(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceId: string,
  sentenceStructureElement: SentenceStructureElement,
): SentenceStructureDocumentSentenceStructureElementNode {
  const matchedCoordination = findCoordinationByStartAndEndWordId(
    sentenceStructureDocument,
    {
      sentenceId,
      startWordId: sentenceStructureElement.startWordId,
      endWordId: sentenceStructureElement.endWordId,
    },
  );
  if (matchedCoordination) {
    return {
      type: "sentence-structure-element",
      sentenceStructureElement,
      children: [
        createSentenceStructureDocumentCoordinationNode(
          sentenceStructureDocument,
          sentenceId,
          matchedCoordination,
        ),
      ],
    };
  }

  if (
    sentenceStructureElement.startWordId === sentenceStructureElement.endWordId
  ) {
    return {
      type: "sentence-structure-element",
      sentenceStructureElement,
      children: [
        createSentenceStructureDocumentWordNode(
          findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: sentenceStructureElement.startWordId,
          })!,
        ),
      ],
    };
  }

  return {
    type: "sentence-structure-element",
    sentenceStructureElement,
    children: _createSpanChildren(sentenceStructureDocument, sentenceId, {
      startWordId: sentenceStructureElement.startWordId,
      endWordId: sentenceStructureElement.endWordId,
    }),
  };
}

function createSentenceStructureDocumentCoordinationPartNode(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceId: string,
  coordinationPart: CoordinationPart,
): SentenceStructureDocumentCoordinationPartNode {
  const matchedSentenceStructureElement =
    findSentenceStructureElementByStartAndEndWordId(sentenceStructureDocument, {
      sentenceId,
      startWordId: coordinationPart.startWordId,
      endWordId: coordinationPart.endWordId,
    });
  if (matchedSentenceStructureElement) {
    return {
      type: "coordination-part",
      coordinationPart,
      children: [
        createSentenceStructureDocumentSentenceStructureElementNode(
          sentenceStructureDocument,
          sentenceId,
          matchedSentenceStructureElement,
        ),
      ],
    };
  }

  const matchedCoordination = findCoordinationByStartAndEndWordId(
    sentenceStructureDocument,
    {
      sentenceId,
      startWordId: coordinationPart.startWordId,
      endWordId: coordinationPart.endWordId,
    },
  );
  if (matchedCoordination) {
    return {
      type: "coordination-part",
      coordinationPart,
      children: [
        createSentenceStructureDocumentCoordinationNode(
          sentenceStructureDocument,
          sentenceId,
          matchedCoordination,
        ),
      ],
    };
  }

  if (coordinationPart.startWordId === coordinationPart.endWordId) {
    return {
      type: "coordination-part",
      coordinationPart,
      children: [
        createSentenceStructureDocumentWordNode(
          findWordById(sentenceStructureDocument, {
            sentenceId,
            wordId: coordinationPart.startWordId,
          })!,
        ),
      ],
    };
  }

  return {
    type: "coordination-part",
    coordinationPart,
    children: _createSpanChildren(sentenceStructureDocument, sentenceId, {
      startWordId: coordinationPart.startWordId,
      endWordId: coordinationPart.endWordId,
    }),
  };
}

function createSentenceStructureDocumentCoordinationNode(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceId: string,
  coordination: Coordination,
): SentenceStructureDocumentCoordinationNode {
  return {
    type: "coordination",
    coordination,
    children: coordination.parts.map((coordinationPart) =>
      createSentenceStructureDocumentCoordinationPartNode(
        sentenceStructureDocument,
        sentenceId,
        coordinationPart,
      ),
    ),
  };
}

function createSentenceStructureDocumentRootNode(
  sentenceStructureDocument: SentenceStructureDocument,
  sentenceId: string,
): SentenceStructureDocumentRootNode {
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === sentenceId,
  );
  if (!sentence) {
    throw new Error("Invalid sentenceId");
  }

  const sentenceStartWord = sentence.words.at(0)!;
  const sentenceEndWord = sentence.words.at(-1)!;

  if (sentence.words.length === 0) {
    return {
      type: "root",
      children: [],
    };
  }

  const matchedSentenceStructureElement =
    findSentenceStructureElementByStartAndEndWordId(sentenceStructureDocument, {
      sentenceId,
      startWordId: sentenceStartWord.id,
      endWordId: sentenceEndWord.id,
    });
  if (matchedSentenceStructureElement) {
    return {
      type: "root",
      children: [
        createSentenceStructureDocumentSentenceStructureElementNode(
          sentenceStructureDocument,
          sentenceId,
          matchedSentenceStructureElement,
        ),
      ],
    };
  }

  const matchedCoordination = findCoordinationByStartAndEndWordId(
    sentenceStructureDocument,
    {
      sentenceId,
      startWordId: sentenceStartWord.id,
      endWordId: sentenceEndWord.id,
    },
  );
  if (matchedCoordination) {
    return {
      type: "root",
      children: [
        createSentenceStructureDocumentCoordinationNode(
          sentenceStructureDocument,
          sentenceId,
          matchedCoordination,
        ),
      ],
    };
  }

  if (sentence.words.length === 1) {
    return {
      type: "root",
      children: [createSentenceStructureDocumentWordNode(sentenceStartWord)],
    };
  }

  return {
    type: "root",
    children: _createSpanChildren(sentenceStructureDocument, sentenceId, {
      startWordId: sentenceStartWord.id,
      endWordId: sentenceEndWord.id,
    }),
  };
}

function createSentenceStructureDocumentSentenceTree(
  sentenceStructureDocument: SentenceStructureDocument,
  sentence: Sentence,
): SentenceStructureDocumentSentenceTree {
  return {
    sentenceId: sentence.id,
    sentenceIndex: sentence.index,
    root: createSentenceStructureDocumentRootNode(
      sentenceStructureDocument,
      sentence.id,
    ),
    modifications: sentence.modifications,
  };
}

export function createSentenceStructureDocumentForest(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureDocumentForest {
  return {
    sentences: sentenceStructureDocument.sentences.map((sentence) =>
      createSentenceStructureDocumentSentenceTree(
        sentenceStructureDocument,
        sentence,
      ),
    ),
  };
}
