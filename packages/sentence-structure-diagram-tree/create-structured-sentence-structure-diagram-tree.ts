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
  return {
    sentenceStructureDiagramNode: {
      word: input.sentenceStructureNode.word,
      position: {
        start: input.nextNodeStartPosition.start,
        end:
          input.nextNodeStartPosition.start +
          input.measureTextWidth(input.sentenceStructureNode.word.text),
        top: input.nextNodeStartPosition.top,
        bottom: input.nextNodeStartPosition.top + lineHeight,
      },
    },
    nextNodeStartPosition: {
      start:
        input.nextNodeStartPosition.start +
        input.measureTextWidth(input.sentenceStructureNode.word.text) +
        wordSpacing,
      top: input.nextNodeStartPosition.top,
    },
    nextLineStartPosition: input.nextLineStartPosition,
  };
}

function createSentenceStructureDiagramRangeNode(
  input: Input<SentenceStructureRangeNode>,
): Result<SentenceStructureDiagramRangeNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = {
    start: nextNodeStartPosition.start,
    top: input.nextLineStartPosition.top,
  };
  const children: SentenceStructureDiagramRangeNode["children"] = [];
  for (const child of input.sentenceStructureNode.children) {
    const childWidth =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: Infinity,
            measureTextWidth: input.measureTextWidth,
          }).sentenceStructureDiagramNode.position.end -
          nextNodeStartPosition.start
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: input.measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: input.measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start;
    if (
      nextNodeStartPosition.start !== input.nextNodeStartPosition.start &&
      input.maxWidth < nextNodeStartPosition.start + childWidth + padding
    ) {
      nextNodeStartPosition = { ...nextLineStartPosition };
      nextLineStartPosition.top += lineHeight + lineSpacing;
    }
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
    nextLineStartPosition: {
      start: input.nextLineStartPosition.start,
      top: nextLineStartPosition.top,
    },
  };
}

function createSentenceStructureDiagramCoordinationChildNode(
  input: Input<SentenceStructureCoordinationChildNode>,
): Result<SentenceStructureDiagramCoordinationChildNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = {
    start: nextNodeStartPosition.start,
    top: input.nextLineStartPosition.top,
  };
  const children: SentenceStructureDiagramCoordinationChildNode["children"] =
    [];
  for (const child of input.sentenceStructureNode.children) {
    const childWidth =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: Infinity,
            measureTextWidth: input.measureTextWidth,
          }).sentenceStructureDiagramNode.position.end -
          nextNodeStartPosition.start
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: input.measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: input.measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start;
    if (
      nextNodeStartPosition.start !== input.nextNodeStartPosition.start &&
      input.maxWidth < nextNodeStartPosition.start + childWidth + padding
    ) {
      nextNodeStartPosition = { ...nextLineStartPosition };
      nextLineStartPosition.top += lineHeight + lineSpacing;
    }
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
    nextLineStartPosition: {
      start: input.nextLineStartPosition.start,
      top: nextLineStartPosition.top,
    },
  };
}

function createSentenceStructureDiagramCoordinationNode(
  input: Input<SentenceStructureCoordinationNode>,
): Result<SentenceStructureDiagramCoordinationNode> {
  let nextNodeStartPosition = { ...input.nextNodeStartPosition };
  let nextLineStartPosition = {
    start: nextNodeStartPosition.start,
    top: nextNodeStartPosition.top + lineHeight + lineSpacing,
  };
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
    nextNodeStartPosition = { ...result.nextLineStartPosition };
    nextLineStartPosition.top += lineHeight + lineSpacing;
  }

  return {
    sentenceStructureDiagramNode: {
      coordination: input.sentenceStructureNode.coordination,
      position: {
        end: Math.max(...children.map((child) => child.position.end)),
        top: input.nextNodeStartPosition.top,
        bottom: nextLineStartPosition.top - lineSpacing,
      },
      children,
    },
    nextNodeStartPosition: {
      start:
        Math.max(...children.map((child) => child.position.end)) + wordSpacing,
      top: input.nextNodeStartPosition.top,
    },
    nextLineStartPosition: {
      start: input.nextLineStartPosition.start,
      top: nextLineStartPosition.top,
    },
  };
}

export function createStructuredSentenceStructureDiagramTree(
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
    const childWidth =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: Infinity,
            measureTextWidth: measureTextWidth,
          }).sentenceStructureDiagramNode.position.end -
          nextNodeStartPosition.start
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: Infinity,
              measureTextWidth: measureTextWidth,
            }).sentenceStructureDiagramNode.position.end -
            nextNodeStartPosition.start;
    if (
      padding !== nextNodeStartPosition.start &&
      maxWidth < nextNodeStartPosition.start + childWidth + padding
    ) {
      nextNodeStartPosition = { ...nextLineStartPosition };
      nextLineStartPosition.top += lineHeight + lineSpacing;
    }
    const result =
      child.type === "word"
        ? createSentenceStructureDiagramWordNode({
            sentenceStructureNode: child,
            nextNodeStartPosition,
            nextLineStartPosition,
            maxWidth: maxWidth,
            measureTextWidth: measureTextWidth,
          })
        : child.type === "range"
          ? createSentenceStructureDiagramRangeNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: maxWidth,
              measureTextWidth: measureTextWidth,
            })
          : createSentenceStructureDiagramCoordinationNode({
              sentenceStructureNode: child,
              nextNodeStartPosition,
              nextLineStartPosition,
              maxWidth: maxWidth,
              measureTextWidth: measureTextWidth,
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
