import type {
  Coordination,
  CoordinationPart,
  Sentence,
  SentenceStructureDocument,
  SentenceStructureElement,
  Word,
} from "../schema.js";
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
  )!;
  const children: (
    | SentenceStructureDocumentWordNode
    | SentenceStructureDocumentSentenceStructureElementNode
    | SentenceStructureDocumentCoordinationNode
  )[] = [];

  const spanStartWordIndex = sentence.words.findIndex(
    (word) => word.id === span.startWordId,
  );
  const spanEndWordIndex = sentence.words.findIndex(
    (word) => word.id === span.endWordId,
  );
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
          const sentenceStructureElementStartWordIndex =
            sentence.words.findIndex(
              (word) => word.id === sentenceStructureElement.startWordId,
            );
          const sentenceStructureElementEndWordIndex = sentence.words.findIndex(
            (word) => word.id === sentenceStructureElement.endWordId,
          );
          return (
            sentenceStructureElementStartWordIndex === currentWordIndex &&
            sentenceStructureElementEndWordIndex <= spanEndWordIndex
          );
        })
        .sort((a, b) => {
          const aEndWordIndex = sentence.words.findIndex(
            (word) => word.id === a.endWordId,
          );
          const bEndWordIndex = sentence.words.findIndex(
            (word) => word.id === b.endWordId,
          );
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
          const coordinationStartWordIndex = sentence.words.findIndex(
            (word) => word.id === coordination.parts.at(0)!.startWordId,
          );
          const coordinationEndWordIndex = sentence.words.findIndex(
            (word) => word.id === coordination.parts.at(-1)!.endWordId,
          );
          return (
            coordinationStartWordIndex === currentWordIndex &&
            coordinationEndWordIndex <= spanEndWordIndex
          );
        })
        .sort((a, b) => {
          const aEndWordIndex = sentence.words.findIndex(
            (word) => word.id === a.parts.at(-1)!.endWordId,
          )!;
          const bEndWordIndex = sentence.words.findIndex(
            (word) => word.id === b.parts.at(-1)!.endWordId,
          )!;
          return bEndWordIndex - aEndWordIndex;
        })
        .at(0) ?? null;
    const matchedSentenceStructureElementEndWordIndex =
      sentence.words.findIndex(
        (word) => word.id === matchedSentenceStructureElement?.endWordId,
      );
    const matchedCoordinationEndWordIndex = sentence.words.findIndex(
      (word) => word.id === matchedCoordination?.parts.at(-1)!.endWordId,
    );
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
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === sentenceId,
  )!;

  const matchedCoordination =
    sentence.coordinations.find(
      (coordination) =>
        coordination.parts.at(0)!.startWordId ===
          sentenceStructureElement.startWordId &&
        coordination.parts.at(-1)!.endWordId ===
          sentenceStructureElement.endWordId,
    ) ?? null;
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
          sentence.words.find(
            (word) => word.id === sentenceStructureElement.startWordId,
          )!,
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
  const sentence = sentenceStructureDocument.sentences.find(
    (sentence) => sentence.id === sentenceId,
  )!;
  const matchedSentenceStructureElement =
    sentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.startWordId === coordinationPart.startWordId &&
        sentenceStructureElement.endWordId === coordinationPart.endWordId,
    ) ?? null;
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

  const matchedCoordination =
    sentence.coordinations.find(
      (coordination) =>
        coordination.parts.at(0)!.startWordId ===
          coordinationPart.startWordId &&
        coordination.parts.at(-1)!.endWordId === coordinationPart.endWordId,
    ) ?? null;
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
          sentence.words.find(
            (word) => word.id === coordinationPart.startWordId,
          )!,
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
  )!;

  const sentenceStartWord = sentence.words.at(0)!;
  const sentenceEndWord = sentence.words.at(-1)!;

  if (sentence.words.length === 0) {
    return {
      type: "root",
      children: [],
    };
  }

  const matchedSentenceStructureElement =
    sentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.startWordId === sentenceStartWord.id &&
        sentenceStructureElement.endWordId === sentenceEndWord.id,
    ) ?? null;
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

  const matchedCoordination =
    sentence.coordinations.find(
      (coordination) =>
        coordination.parts.at(0)!.startWordId === sentenceStartWord.id &&
        coordination.parts.at(-1)!.endWordId === sentenceEndWord.id,
    ) ?? null;
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
