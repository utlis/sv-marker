import {
  findCoordinationByStartAndEndWordIndex,
  findRangeByStartAndEndWordIndex,
  type Coordination,
  type SentenceStructureData,
  type Word,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type {
  SentenceStructureCoordinationNode,
  SentenceStructureRangeNode,
  SentenceStructureTree,
  SentenceStructureWordNode,
} from "./types.js";

function createSentenceStructureWordNode(
  word: Word,
): SentenceStructureWordNode {
  return {
    type: "word",
    word,
  };
}

function createSpanChildren(
  sentenceStructureData: SentenceStructureData,
  span: {
    startWordIndex: number;
    endWordIndex: number;
  },
): (
  | SentenceStructureWordNode
  | SentenceStructureRangeNode
  | SentenceStructureCoordinationNode
)[] {
  const children: (
    | SentenceStructureWordNode
    | SentenceStructureRangeNode
    | SentenceStructureCoordinationNode
  )[] = [];

  let currentWordIndex = span.startWordIndex;
  while (currentWordIndex <= span.endWordIndex) {
    const nestedRange =
      sentenceStructureData.ranges
        .filter(
          (range) =>
            range.startWordIndex !== span.startWordIndex ||
            range.endWordIndex !== span.endWordIndex,
        )
        .filter(
          (range) =>
            range.startWordIndex === currentWordIndex &&
            range.endWordIndex <= span.endWordIndex,
        )
        .sort((a, b) => b.endWordIndex - a.endWordIndex)
        .at(0) ?? null;
    const nestedCoordination =
      sentenceStructureData.coordinations
        .filter(
          (coordination) =>
            coordination.children.at(0)!.startWordIndex === currentWordIndex &&
            coordination.children.at(-1)!.endWordIndex <= span.endWordIndex,
        )
        .sort(
          (a, b) =>
            b.children.at(-1)!.endWordIndex - a.children.at(-1)!.endWordIndex,
        )
        .at(0) ?? null;
    if (!nestedRange && !nestedCoordination) {
      children.push(
        createSentenceStructureWordNode(
          sentenceStructureData.words[currentWordIndex]!,
        ),
      );
      currentWordIndex++;
    } else if (nestedRange && !nestedCoordination) {
      children.push({
        type: "range",
        range: nestedRange,
        children: createSpanChildren(sentenceStructureData, nestedRange),
      });
      currentWordIndex = nestedRange.endWordIndex + 1;
    } else if (!nestedRange && nestedCoordination) {
      children.push(
        createSentenceStructureCoordinationNode(
          sentenceStructureData,
          nestedCoordination,
        ),
      );
      currentWordIndex = nestedCoordination.children.at(-1)!.endWordIndex + 1;
    } else if (nestedRange && nestedCoordination) {
      const nestedRangeEndWordIndex = nestedRange.endWordIndex;
      const nestedCoordinationEndWordIndex =
        nestedCoordination.children.at(-1)!.endWordIndex;
      if (nestedCoordinationEndWordIndex < nestedRangeEndWordIndex) {
        children.push({
          type: "range",
          range: nestedRange,
          children: createSpanChildren(sentenceStructureData, nestedRange),
        });
        currentWordIndex = nestedRangeEndWordIndex + 1;
      } else {
        children.push(
          createSentenceStructureCoordinationNode(
            sentenceStructureData,
            nestedCoordination,
          ),
        );
        currentWordIndex = nestedCoordinationEndWordIndex + 1;
      }
    }
  }

  return children;
}

function createSentenceStructureCoordinationNode(
  sentenceStructureData: SentenceStructureData,
  coordination: Coordination,
): SentenceStructureCoordinationNode {
  const children: SentenceStructureCoordinationNode["children"] =
    coordination.children.map((child) => {
      const nestedRange = findRangeByStartAndEndWordIndex(
        sentenceStructureData,
        {
          startWordIndex: child.startWordIndex,
          endWordIndex: child.endWordIndex,
        },
      );
      const nestedCoordination = findCoordinationByStartAndEndWordIndex(
        sentenceStructureData,
        {
          startWordIndex: child.startWordIndex,
          endWordIndex: child.endWordIndex,
        },
      );
      if (nestedRange && nestedCoordination) {
        return {
          type: "coordination-child",
          coordinationChild: child,
          children: [
            {
              type: "range",
              range: nestedRange,
              children: [
                createSentenceStructureCoordinationNode(
                  sentenceStructureData,
                  nestedCoordination,
                ),
              ],
            },
          ],
        };
      } else if (nestedRange) {
        return {
          type: "coordination-child",
          coordinationChild: child,
          children: [
            child.startWordIndex === child.endWordIndex
              ? {
                  type: "range",
                  range: nestedRange,
                  children: [
                    createSentenceStructureWordNode(
                      sentenceStructureData.words[child.startWordIndex]!,
                    ),
                  ],
                }
              : {
                  type: "range",
                  range: nestedRange,
                  children: createSpanChildren(
                    sentenceStructureData,
                    nestedRange,
                  ),
                },
          ],
        };
      } else if (nestedCoordination) {
        return {
          type: "coordination-child",
          coordinationChild: child,
          children: [
            createSentenceStructureCoordinationNode(
              sentenceStructureData,
              nestedCoordination,
            ),
          ],
        };
      } else {
        return child.startWordIndex === child.endWordIndex
          ? {
              type: "coordination-child",
              coordinationChild: child,
              children: [
                createSentenceStructureWordNode(
                  sentenceStructureData.words[child.startWordIndex]!,
                ),
              ],
            }
          : {
              type: "coordination-child",
              coordinationChild: child,
              children: createSpanChildren(sentenceStructureData, child),
            };
      }
    });

  return {
    type: "coordination",
    coordination,
    children,
  };
}

export function createTree(
  sentenceStructureData: SentenceStructureData,
): SentenceStructureTree {
  const nestedRange = findRangeByStartAndEndWordIndex(sentenceStructureData, {
    startWordIndex: 0,
    endWordIndex: sentenceStructureData.words.length - 1,
  });
  const nestedCoordination = findCoordinationByStartAndEndWordIndex(
    sentenceStructureData,
    {
      startWordIndex: 0,
      endWordIndex: sentenceStructureData.words.length - 1,
    },
  );
  if (sentenceStructureData.words.length === 0) {
    return {
      type: "tree",
      children: [],
    };
  }
  if (nestedRange && nestedCoordination) {
    return {
      type: "tree",
      children: [
        {
          type: "range",
          range: nestedRange,
          children: [
            createSentenceStructureCoordinationNode(
              sentenceStructureData,
              nestedCoordination,
            ),
          ],
        },
      ],
    };
  } else if (nestedRange) {
    return {
      type: "tree",
      children: [
        sentenceStructureData.words.length === 1
          ? {
              type: "range",
              range: nestedRange,
              children: [
                createSentenceStructureWordNode(
                  sentenceStructureData.words[0]!,
                ),
              ],
            }
          : {
              type: "range",
              range: nestedRange,
              children: createSpanChildren(sentenceStructureData, nestedRange),
            },
      ],
    };
  } else if (nestedCoordination) {
    return {
      type: "tree",
      children: [
        createSentenceStructureCoordinationNode(
          sentenceStructureData,
          nestedCoordination,
        ),
      ],
    };
  } else {
    return sentenceStructureData.words.length === 1
      ? {
          type: "tree",
          children: [
            createSentenceStructureWordNode(sentenceStructureData.words[0]!),
          ],
        }
      : {
          type: "tree",
          children: createSpanChildren(sentenceStructureData, {
            startWordIndex: 0,
            endWordIndex: sentenceStructureData.words.length - 1,
          }),
        };
  }
}
