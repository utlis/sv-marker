import type {
  SentenceStructureDocumentCoordinationNode,
  SentenceStructureDocumentCoordinationPartNode,
  SentenceStructureDocumentRootNode,
  SentenceStructureDocumentSentenceStructureElementNode,
  SentenceStructureDocumentForest,
  SentenceStructureDocumentWordNode,
  SentenceStructureDocumentSentenceTree,
} from "../types.js";
import type {
  SentenceStructureDecoratedDocumentCoordinationNode,
  SentenceStructureDecoratedDocumentCoordinationPartNode,
  SentenceStructureDecoratedDocumentRootNode,
  SentenceStructureDecoratedDocumentSentenceStructureElementNode,
  SentenceStructureDecoratedDocumentForest,
  SentenceStructureDecoratedDocumentWordNode,
  SentenceStructureDecoratedDocumentSentenceTree,
} from "./types.js";

function createSentenceStructureDecoratedDocumentWordNode(
  sentenceStructureDocumentWordNode: SentenceStructureDocumentWordNode,
): SentenceStructureDecoratedDocumentWordNode {
  return {
    type: "word",
    word: sentenceStructureDocumentWordNode.word,
  };
}

function createSentenceStructureDecoratedDocumentSentenceStructureElementNode(
  sentenceStructureDocumentSentenceStructureElementNode: SentenceStructureDocumentSentenceStructureElementNode,
  nestingDepth: number,
  conjunctOrdinalPath: number[],
): SentenceStructureDecoratedDocumentSentenceStructureElementNode {
  return {
    type: "sentence-structure-element",
    sentenceStructureElement:
      sentenceStructureDocumentSentenceStructureElementNode.sentenceStructureElement,
    nestingDepth,
    conjunctOrdinalPath,
    children:
      sentenceStructureDocumentSentenceStructureElementNode.children.map(
        (child) => {
          switch (child.type) {
            case "word":
              return createSentenceStructureDecoratedDocumentWordNode(child);
            case "sentence-structure-element":
              return createSentenceStructureDecoratedDocumentSentenceStructureElementNode(
                child,
                nestingDepth +
                  (sentenceStructureDocumentSentenceStructureElementNode
                    .sentenceStructureElement.kind === "sentence-constituent"
                    ? 1
                    : 0),
                conjunctOrdinalPath,
              );
            case "coordination":
              return createSentenceStructureDecoratedDocumentCoordinationNode(
                child,
                nestingDepth +
                  (sentenceStructureDocumentSentenceStructureElementNode
                    .sentenceStructureElement.kind === "sentence-constituent"
                    ? 1
                    : 0),
                conjunctOrdinalPath,
              );
            default:
              child satisfies never;
              throw new Error("Unreachable");
          }
        },
      ),
  };
}

function createSentenceStructureDecoratedDocumentCoordinationPartNode(
  sentenceStructureDocumentCoordinationPartNode: SentenceStructureDocumentCoordinationPartNode,
  coordinationId: string,
  nestingDepth: number,
  conjunctOrdinalPath: number[],
): SentenceStructureDecoratedDocumentCoordinationPartNode {
  return {
    type: "coordination-part",
    coordinationPart:
      sentenceStructureDocumentCoordinationPartNode.coordinationPart,
    coordinationId,
    children: sentenceStructureDocumentCoordinationPartNode.children.map(
      (child) => {
        switch (child.type) {
          case "word":
            return createSentenceStructureDecoratedDocumentWordNode(child);
          case "sentence-structure-element":
            return createSentenceStructureDecoratedDocumentSentenceStructureElementNode(
              child,
              nestingDepth,
              conjunctOrdinalPath,
            );
          case "coordination":
            return createSentenceStructureDecoratedDocumentCoordinationNode(
              child,
              nestingDepth,
              conjunctOrdinalPath,
            );
          default:
            child satisfies never;
            throw new Error("Unreachable");
        }
      },
    ),
  };
}

function createSentenceStructureDecoratedDocumentCoordinationNode(
  sentenceStructureDocumentCoordinationNode: SentenceStructureDocumentCoordinationNode,
  nestingDepth: number,
  conjunctOrdinalPath: number[],
): SentenceStructureDecoratedDocumentCoordinationNode {
  let conjunctOrdinal = 0;
  const children = sentenceStructureDocumentCoordinationNode.children.map(
    (child) => {
      if (
        child.type === "coordination-part" &&
        child.coordinationPart.type === "conjunct"
      ) {
        conjunctOrdinal++;
      }
      return createSentenceStructureDecoratedDocumentCoordinationPartNode(
        child,
        sentenceStructureDocumentCoordinationNode.coordination.id,
        nestingDepth,
        [...conjunctOrdinalPath, conjunctOrdinal],
      );
    },
  );

  return {
    type: "coordination",
    coordination: sentenceStructureDocumentCoordinationNode.coordination,
    children,
  };
}

function createSentenceStructureDecoratedDocumentRootNode(
  sentenceStructureDocumentRootNode: SentenceStructureDocumentRootNode,
): SentenceStructureDecoratedDocumentRootNode {
  return {
    type: "root",
    children: sentenceStructureDocumentRootNode.children.map((child) => {
      switch (child.type) {
        case "word":
          return createSentenceStructureDecoratedDocumentWordNode(child);
        case "sentence-structure-element":
          return createSentenceStructureDecoratedDocumentSentenceStructureElementNode(
            child,
            0,
            [],
          );
        case "coordination":
          return createSentenceStructureDecoratedDocumentCoordinationNode(
            child,
            0,
            [],
          );
        default:
          child satisfies never;
          throw new Error("Unreachable");
      }
    }),
  };
}

function createSentenceStructureDecoratedDocumentSentenceTree(
  sentenceStructureDocumentSentenceTree: SentenceStructureDocumentSentenceTree,
): SentenceStructureDecoratedDocumentSentenceTree {
  return {
    sentenceId: sentenceStructureDocumentSentenceTree.sentenceId,
    sentenceIndex: sentenceStructureDocumentSentenceTree.sentenceIndex,
    root: createSentenceStructureDecoratedDocumentRootNode(
      sentenceStructureDocumentSentenceTree.root,
    ),
    modifications: sentenceStructureDocumentSentenceTree.modifications,
  };
}

export function createSentenceStructureDecoratedDocumentForest(
  sentenceStructureDocumentForest: SentenceStructureDocumentForest,
): SentenceStructureDecoratedDocumentForest {
  return {
    sentences: sentenceStructureDocumentForest.sentences.map(
      (sentenceStructureDocumentSentenceTree) =>
        createSentenceStructureDecoratedDocumentSentenceTree(
          sentenceStructureDocumentSentenceTree,
        ),
    ),
  };
}
