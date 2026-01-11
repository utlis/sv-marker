import type {
  SentenceStructureCoordinationChildNode,
  SentenceStructureCoordinationNode,
  SentenceStructureNode,
  SentenceStructureRangeNode,
  SentenceStructureTree,
  SentenceStructureWordNode,
} from "@sentence-structure-diagram-app/sentence-structure-tree";
import type {
  SentenceStructureDiagramCoordinationChildNode,
  SentenceStructureDiagramCoordinationNode,
  SentenceStructureDiagramNode,
  SentenceStructureDiagramTree,
  SentenceStructureDiagramRangeNode,
  SentenceStructureDiagramWordNode,
} from "./types.js";
import { lineHeight, lineSpacing, padding, wordSpacing } from "./constants.js";

type Input<T extends SentenceStructureNode> = {
  sentenceStructureNode: T;
  nextNodeStartPosition: {
    start: number;
    top: number;
  };
  nextLineStartPosition: {
    start: number;
    top: number;
  };
  maxWidth: number;
  measureTextWidth: (text: string) => number;
};

type Result<T extends SentenceStructureDiagramNode> = {
  sentenceStructureDiagramNode: T;
  nextNodeStartPosition: {
    start: number;
    top: number;
  };
  nextLineStartPosition: {
    start: number;
    top: number;
  };
};

function createSentenceStructureDiagramWordNode(
  input: Input<SentenceStructureWordNode>,
): Result<SentenceStructureDiagramWordNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = { ...input.nextLineStartPosition };
  if (
    input.maxWidth <
    input.nextNodeStartPosition.start +
      input.measureTextWidth(input.sentenceStructureNode.word.text) +
      padding
  ) {
    nextNodeStartPosition = { ...input.nextLineStartPosition };
    nextLineStartPosition.top += lineHeight + lineSpacing;
  }
  return {
    sentenceStructureDiagramNode: {
      word: input.sentenceStructureNode.word,
      position: {
        start: nextNodeStartPosition.start,
        end:
          nextNodeStartPosition.start +
          input.measureTextWidth(input.sentenceStructureNode.word.text),
        top: nextNodeStartPosition.top,
        bottom: nextNodeStartPosition.top + lineHeight,
      },
    },
    nextNodeStartPosition: {
      start:
        nextNodeStartPosition.start +
        input.measureTextWidth(input.sentenceStructureNode.word.text) +
        wordSpacing,
      top: nextNodeStartPosition.top,
    },
    nextLineStartPosition,
  };
}

function createSentenceStructureDiagramRangeNode(
  input: Input<SentenceStructureRangeNode>,
): Result<SentenceStructureDiagramRangeNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = { ...input.nextLineStartPosition };
  const children: SentenceStructureDiagramRangeNode["children"] = [];
  for (const child of input.sentenceStructureNode.children) {
    const result =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: input.maxWidth,
            measureTextWidth: input.measureTextWidth,
          })
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: input.maxWidth,
              measureTextWidth: input.measureTextWidth,
            })
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: input.maxWidth,
              measureTextWidth: input.measureTextWidth,
            });
    children.push(result.sentenceStructureDiagramNode);
    nextNodeStartPosition = { ...result.nextNodeStartPosition };
    nextLineStartPosition = { ...result.nextLineStartPosition };
  }

  return {
    sentenceStructureDiagramNode: {
      range: input.sentenceStructureNode.range,
      position: {
        end: nextNodeStartPosition.start - wordSpacing,
        top: input.nextNodeStartPosition.top,
        bottom: nextLineStartPosition.top - lineSpacing,
      },
      children: children,
    },
    nextNodeStartPosition,
    nextLineStartPosition,
  };
}

function createSentenceStructureDiagramCoordinationChildNode(
  input: Input<SentenceStructureCoordinationChildNode>,
): Result<SentenceStructureDiagramCoordinationChildNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = { ...input.nextLineStartPosition };
  const children: SentenceStructureDiagramRangeNode["children"] = [];
  for (const child of input.sentenceStructureNode.children) {
    const result =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: input.maxWidth,
            measureTextWidth: input.measureTextWidth,
          })
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: input.maxWidth,
              measureTextWidth: input.measureTextWidth,
            })
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: input.maxWidth,
              measureTextWidth: input.measureTextWidth,
            });
    children.push(result.sentenceStructureDiagramNode);
    nextNodeStartPosition = { ...result.nextNodeStartPosition };
    nextLineStartPosition = { ...result.nextLineStartPosition };
  }

  return {
    sentenceStructureDiagramNode: {
      coordinationChild: input.sentenceStructureNode.coordinationChild,
      position: {
        end: nextNodeStartPosition.start - wordSpacing,
        top: input.nextNodeStartPosition.top,
        bottom: nextLineStartPosition.top - lineSpacing,
      },
      children: children,
    },
    nextNodeStartPosition,
    nextLineStartPosition,
  };
}

function createSentenceStructureDiagramCoordinationNode(
  input: Input<SentenceStructureCoordinationNode>,
): Result<SentenceStructureDiagramCoordinationNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = { ...input.nextLineStartPosition };
  const children: SentenceStructureDiagramCoordinationNode["children"] = [];
  for (const child of input.sentenceStructureNode.children) {
    const result = createSentenceStructureDiagramCoordinationChildNode({
      sentenceStructureNode: child,
      nextNodeStartPosition,
      nextLineStartPosition,
      maxWidth: input.maxWidth,
      measureTextWidth: input.measureTextWidth,
    });
    children.push(result.sentenceStructureDiagramNode);
    nextNodeStartPosition = { ...result.nextNodeStartPosition };
    nextLineStartPosition = { ...result.nextLineStartPosition };
  }

  return {
    sentenceStructureDiagramNode: {
      coordination: input.sentenceStructureNode.coordination,
      position: {
        end: nextNodeStartPosition.start - wordSpacing,
        top: input.nextNodeStartPosition.top,
        bottom: nextLineStartPosition.top - lineSpacing,
      },
      children,
    },
    nextNodeStartPosition,
    nextLineStartPosition,
  };
}

export function createLinearSentenceStructureDiagramTree(
  sentenceStructureTree: SentenceStructureTree,
  maxWidth: number,
  measureTextWidth: (text: string) => number,
): SentenceStructureDiagramTree {
  let nextNodeStartPosition = { start: padding, top: padding };
  let nextLineStartPosition = {
    start: padding,
    top: padding + lineHeight + lineSpacing,
  };
  const children: SentenceStructureDiagramTree["children"] = [];
  for (const child of sentenceStructureTree.children) {
    const result =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth,
            measureTextWidth,
          })
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth,
              measureTextWidth,
            })
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth,
              measureTextWidth,
            });
    children.push(result.sentenceStructureDiagramNode);
    nextNodeStartPosition = { ...result.nextNodeStartPosition };
    nextLineStartPosition = { ...result.nextLineStartPosition };
  }

  return {
    position: {
      start: 0,
      end: maxWidth,
      top: 0,
      bottom: nextLineStartPosition.top - lineSpacing + padding,
    },
    children: children,
  };
}
