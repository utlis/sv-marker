import { coordinationGroupIndicatorMetrics } from "../constants.js";
import type {
  SentenceStructureDiagramModelCoordinationNode,
  SentenceStructureDiagramModelCoordinationPartNode,
  SentenceStructureDiagramModelForest,
  SentenceStructureDiagramModelNode,
  SentenceStructureDiagramModelRootNode,
  SentenceStructureDiagramModelSentenceStructureElementNode,
  SentenceStructureDiagramModelSentenceTree,
  SentenceStructureDiagramModelWordNode,
} from "../diagram-model/types.js";
import type {
  RangeMarker,
  Rectangle,
  SentenceStructureDiagramLayoutCoordinationNode,
  SentenceStructureDiagramLayoutCoordinationPartNode,
  SentenceStructureDiagramLayoutNode,
  SentenceStructureDiagramLayoutRootNode,
  SentenceStructureDiagramLayoutSentenceStructureElementNode,
  SentenceStructureDiagramLayoutSentenceTree,
  SentenceStructureDiagramLayoutTree,
  SentenceStructureDiagramLayoutWordNode,
} from "./types.js";

type LayoutContext =
  | {
      canvas: {
        width: number;
      };
      spacing: {
        padding: number;
        wordSpacing: number;
        lineSpacing: number;
        continuationIndent: number;
      };
      enableReflow: false;
      coordination: {
        layoutDirection: "horizontal";
        groupIndicator: {
          type: "bus-connector";
        } | null;
      };
      measureTextWidth: (text: string, fontSize: number) => number;
    }
  | {
      canvas: {
        width: number;
      };
      spacing: {
        padding: number;
        wordSpacing: number;
        lineSpacing: number;
        continuationIndent: number;
      };
      enableReflow: true;
      coordination: {
        layoutDirection: "vertical";
        groupIndicator:
          | {
              type: "bracket";
              placement: "left" | "both-sides";
              bracketType:
                | "parenthesis"
                | "angle-bracket"
                | "curly-bracket"
                | "square-bracket";
            }
          | {
              type: "bus-connector";
            }
          | null;
      };
      layoutStrategy:
        | {
            lineBreakStrategy: "greedy-word-wrap";
          }
        | {
            lineBreakStrategy: "largest-boundary-first";
            continuationLineStart: "content-start" | "scope-start";
          };
      measureTextWidth: (text: string, fontSize: number) => number;
    };

function estimateWidth(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelNode,
  layoutContext: LayoutContext,
): number {
  switch (sentenceStructureDiagramModelNode.type) {
    case "word":
      return layoutContext.measureTextWidth(
        sentenceStructureDiagramModelNode.text,
        sentenceStructureDiagramModelNode.style.fontSize,
      );
    case "sentence-structure-element":
    case "coordination-part":
    case "coordination":
    case "root":
      if (
        sentenceStructureDiagramModelNode.type === "coordination" &&
        layoutContext.coordination.layoutDirection === "vertical"
      ) {
        const coordinationGroupIndicatorReservedWidth =
          (coordinationGroupIndicatorMetrics.vertical.groupIndicatorOffsetX +
            coordinationGroupIndicatorMetrics.vertical.groupIndicatorWidth) *
          (layoutContext.coordination.groupIndicator
            ? layoutContext.coordination.groupIndicator.type === "bracket" &&
              layoutContext.coordination.groupIndicator.placement ===
                "both-sides"
              ? 2
              : 1
            : 0);
        return (
          Math.max(
            ...sentenceStructureDiagramModelNode.children.map((child) =>
              estimateWidth(child, layoutContext),
            ),
          ) + coordinationGroupIndicatorReservedWidth
        );
      }

      const bracketRangeMarkerReservedWidth =
        layoutContext.enableReflow &&
        sentenceStructureDiagramModelNode.type ===
          "sentence-structure-element" &&
        sentenceStructureDiagramModelNode.rangeMarker?.type === "bracket"
          ? layoutContext.measureTextWidth(
              sentenceStructureDiagramModelNode.rangeMarker.openingBracket,
              sentenceStructureDiagramModelNode.rangeMarker.style.fontSize,
            ) +
            layoutContext.measureTextWidth(
              sentenceStructureDiagramModelNode.rangeMarker.closingBracket,
              sentenceStructureDiagramModelNode.rangeMarker.style.fontSize,
            )
          : 0;
      return (
        sentenceStructureDiagramModelNode.children.reduce(
          (sum, child, index) => {
            return (
              sum +
              (index === 0 ? 0 : layoutContext.spacing.wordSpacing) +
              estimateWidth(child, layoutContext)
            );
          },
          0,
        ) + bracketRangeMarkerReservedWidth
      );
    default:
      sentenceStructureDiagramModelNode satisfies never;
      throw new Error("Unreachable");
  }
}

function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelWordNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutWordNode;
function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelSentenceStructureElementNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutSentenceStructureElementNode;
function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelCoordinationPartNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutCoordinationPartNode;
function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelCoordinationNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutCoordinationNode;
function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelRootNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutRootNode;
function createSentenceStructureDiagramLayoutNode(
  sentenceStructureDiagramModelNode: SentenceStructureDiagramModelNode,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutNode {
  switch (sentenceStructureDiagramModelNode.type) {
    case "word": {
      const width = layoutContext.measureTextWidth(
        sentenceStructureDiagramModelNode.text,
        sentenceStructureDiagramModelNode.style.fontSize,
      );
      const height = sentenceStructureDiagramModelNode.style.fontSize;

      return {
        type: "word",
        id: sentenceStructureDiagramModelNode.id,
        text: sentenceStructureDiagramModelNode.text,
        whitespaceAfter: sentenceStructureDiagramModelNode.whitespaceAfter,
        rectangle: {
          left: origin.left,
          top: origin.top,
          right: origin.left + width,
          bottom: origin.top + height,
        },
        style: sentenceStructureDiagramModelNode.style,
      };
    }
    case "sentence-structure-element":
    case "coordination-part":
    case "root":
      const openingBracketRangeMarkerReservedWidth =
        sentenceStructureDiagramModelNode.type ===
          "sentence-structure-element" &&
        sentenceStructureDiagramModelNode.rangeMarker?.type === "bracket"
          ? layoutContext.measureTextWidth(
              sentenceStructureDiagramModelNode.rangeMarker.openingBracket,
              sentenceStructureDiagramModelNode.rangeMarker.style.fontSize,
            )
          : 0;
      let cursor = {
        left:
          origin.left +
          (layoutContext.enableReflow
            ? openingBracketRangeMarkerReservedWidth
            : 0),
        top: origin.top,
      };
      const nextLineCursor =
        (layoutContext.enableReflow &&
          layoutContext.layoutStrategy.lineBreakStrategy ===
            "largest-boundary-first" &&
          layoutContext.layoutStrategy.continuationLineStart ===
            "scope-start") ||
        (sentenceStructureDiagramModelNode.type === "coordination-part" &&
          layoutContext.coordination.layoutDirection === "vertical")
          ? {
              left: origin.left + layoutContext.spacing.continuationIndent,
              top: origin.top + layoutContext.spacing.lineSpacing,
            }
          : {
              left: layoutContext.spacing.padding,
              top: origin.top + lineHeight + layoutContext.spacing.lineSpacing,
            };
      const rectangles: Rectangle[] = [
        {
          left: origin.left,
          top: origin.top,
          right: origin.left,
          bottom: origin.top,
        },
      ];
      const children = [];
      for (const child of sentenceStructureDiagramModelNode.children) {
        const shouldBreakLine = (() => {
          if (
            estimateWidth(child, layoutContext) <=
            layoutContext.canvas.width -
              layoutContext.spacing.padding -
              cursor.left
          ) {
            return false;
          }

          if (cursor.left <= nextLineCursor.left) {
            return false;
          }

          if (
            (!layoutContext.enableReflow ||
              layoutContext.layoutStrategy.lineBreakStrategy ===
                "greedy-word-wrap") &&
            child.type !== "word"
          ) {
            return false;
          }

          return true;
        })();

        if (shouldBreakLine) {
          cursor = { ...nextLineCursor };
          nextLineCursor.left +=
            (layoutContext.enableReflow &&
              layoutContext.layoutStrategy.lineBreakStrategy ===
                "largest-boundary-first" &&
              layoutContext.layoutStrategy.continuationLineStart ===
                "scope-start") ||
            (sentenceStructureDiagramModelNode.type === "coordination-part" &&
              layoutContext.coordination.layoutDirection === "vertical")
              ? layoutContext.spacing.continuationIndent
              : 0;
          nextLineCursor.top += layoutContext.spacing.lineSpacing;
          rectangles.push({
            left: cursor.left,
            top: cursor.top,
            right: cursor.left,
            bottom: cursor.top,
          });
        }

        const childResult = (() => {
          switch (child.type) {
            case "word":
              return createSentenceStructureDiagramLayoutNode(
                child,
                cursor,
                nextLineCursor.top -
                  layoutContext.spacing.lineSpacing -
                  cursor.top,
                layoutContext,
              );
            case "sentence-structure-element":
              return createSentenceStructureDiagramLayoutNode(
                child,
                cursor,
                nextLineCursor.top -
                  layoutContext.spacing.lineSpacing -
                  cursor.top,
                layoutContext,
              );
            case "coordination":
              return createSentenceStructureDiagramLayoutNode(
                child,
                cursor,
                nextLineCursor.top -
                  layoutContext.spacing.lineSpacing -
                  cursor.top,
                layoutContext,
              );
            default:
              child satisfies never;
              throw new Error("Unreachable");
          }
        })();

        cursor =
          (layoutContext.enableReflow &&
            layoutContext.layoutStrategy.lineBreakStrategy ===
              "largest-boundary-first" &&
            layoutContext.layoutStrategy.continuationLineStart ===
              "scope-start") ||
          (sentenceStructureDiagramModelNode.type === "coordination-part" &&
            layoutContext.coordination.layoutDirection === "vertical")
            ? {
                left:
                  childResult.type === "word"
                    ? childResult.rectangle.right +
                      layoutContext.spacing.wordSpacing
                    : Math.max(
                        ...childResult.rectangles.map(
                          (rectangle) => rectangle.right,
                        ),
                      ) + layoutContext.spacing.wordSpacing,
                top: cursor.top,
              }
            : {
                left:
                  childResult.type === "word"
                    ? childResult.rectangle.right +
                      layoutContext.spacing.wordSpacing
                    : childResult.rectangles.at(-1)!.right +
                      layoutContext.spacing.wordSpacing,
                top:
                  childResult.type === "word"
                    ? childResult.rectangle.top
                    : childResult.rectangles.at(-1)!.top,
              };
        nextLineCursor.top = Math.max(
          nextLineCursor.top,
          ...(childResult.type === "word"
            ? [childResult.rectangle.bottom + layoutContext.spacing.lineSpacing]
            : childResult.rectangles.map(
                (rectangle) =>
                  rectangle.bottom + layoutContext.spacing.lineSpacing,
              )),
        );
        for (const rectangle of childResult.type === "word"
          ? [childResult.rectangle]
          : childResult.rectangles) {
          if (rectangle.top === rectangles.at(-1)!.top) {
            rectangles.at(-1)!.right = rectangle.right;
            rectangles.at(-1)!.bottom = Math.max(
              rectangles.at(-1)!.bottom,
              rectangle.bottom,
            );
          } else {
            rectangles.push({
              left: rectangle.left,
              top: rectangle.top,
              right: rectangle.right,
              bottom: rectangle.bottom,
            });
          }
        }
        children.push(childResult);
      }

      const closingBracketRangeMarkerReservedWidth =
        sentenceStructureDiagramModelNode.type ===
          "sentence-structure-element" &&
        sentenceStructureDiagramModelNode.rangeMarker?.type === "bracket"
          ? layoutContext.measureTextWidth(
              sentenceStructureDiagramModelNode.rangeMarker.closingBracket,
              sentenceStructureDiagramModelNode.rangeMarker.style.fontSize,
            )
          : 0;
      cursor.left += layoutContext.enableReflow
        ? closingBracketRangeMarkerReservedWidth
        : 0;
      rectangles.at(-1)!.right += layoutContext.enableReflow
        ? closingBracketRangeMarkerReservedWidth
        : 0;

      switch (sentenceStructureDiagramModelNode.type) {
        case "sentence-structure-element":
        case "coordination-part":
          const rangeMarker: RangeMarker = (() => {
            if (
              sentenceStructureDiagramModelNode.rangeMarker?.type !== "bracket"
            ) {
              return sentenceStructureDiagramModelNode.rangeMarker;
            }

            function calculateOpeningBracketReservedWidth(
              sentenceStructureDiagramModelNode: SentenceStructureDiagramModelNode,
            ): number {
              if (sentenceStructureDiagramModelNode.type === "word") {
                return 0;
              }

              if (
                sentenceStructureDiagramModelNode.type ===
                  "sentence-structure-element" &&
                sentenceStructureDiagramModelNode.rangeMarker?.type ===
                  "bracket"
              ) {
                return (
                  calculateOpeningBracketReservedWidth(
                    sentenceStructureDiagramModelNode.children[0]!,
                  ) +
                  layoutContext.measureTextWidth(
                    sentenceStructureDiagramModelNode.rangeMarker
                      .openingBracket,
                    sentenceStructureDiagramModelNode.rangeMarker.style
                      .fontSize,
                  )
                );
              }

              return calculateOpeningBracketReservedWidth(
                sentenceStructureDiagramModelNode.children[0]!,
              );
            }

            function calculateClosingBracketReservedWidth(
              sentenceStructureDiagramModelNode: SentenceStructureDiagramModelNode,
            ): number {
              if (sentenceStructureDiagramModelNode.type === "word") {
                return 0;
              }

              if (
                sentenceStructureDiagramModelNode.type ===
                  "sentence-structure-element" &&
                sentenceStructureDiagramModelNode.rangeMarker?.type ===
                  "bracket"
              ) {
                return (
                  calculateClosingBracketReservedWidth(
                    sentenceStructureDiagramModelNode.children[0]!,
                  ) +
                  layoutContext.measureTextWidth(
                    sentenceStructureDiagramModelNode.rangeMarker
                      .closingBracket,
                    sentenceStructureDiagramModelNode.rangeMarker.style
                      .fontSize,
                  )
                );
              }

              return calculateClosingBracketReservedWidth(
                sentenceStructureDiagramModelNode.children[0]!,
              );
            }

            return {
              type: "bracket",
              openingBracket: {
                text: sentenceStructureDiagramModelNode.rangeMarker
                  .openingBracket,
                left:
                  origin.left -
                  (layoutContext.enableReflow
                    ? 0
                    : calculateOpeningBracketReservedWidth(
                        sentenceStructureDiagramModelNode,
                      )),
                top: origin.top,
              },
              closingBracket: {
                text: sentenceStructureDiagramModelNode.rangeMarker
                  .closingBracket,
                left:
                  cursor.left -
                  layoutContext.spacing.wordSpacing -
                  closingBracketRangeMarkerReservedWidth +
                  (layoutContext.enableReflow
                    ? 0
                    : calculateClosingBracketReservedWidth(
                        sentenceStructureDiagramModelNode,
                      )),
                top: cursor.top,
              },
              style: sentenceStructureDiagramModelNode.rangeMarker.style,
            };
          })();
          switch (sentenceStructureDiagramModelNode.type) {
            case "sentence-structure-element":
              return {
                type: "sentence-structure-element",
                id: sentenceStructureDiagramModelNode.id,
                rectangles,
                rangeMarker,
                sentenceElementLabel:
                  sentenceStructureDiagramModelNode.sentenceElementLabel,
                sentenceConstituentLabel:
                  sentenceStructureDiagramModelNode.sentenceConstituentLabel,
                children,
              };
            case "coordination-part":
              return {
                type: "coordination-part",
                id: sentenceStructureDiagramModelNode.id,
                rectangles,
                rangeMarker,
                children,
              };
            default:
              sentenceStructureDiagramModelNode satisfies never;
              throw new Error("Unreachable");
          }
        case "root":
          return {
            type: "root",
            rectangles,
            children,
          };
        default:
          sentenceStructureDiagramModelNode satisfies never;
          throw new Error("Unreachable");
      }
    case "coordination":
      if (layoutContext.coordination.layoutDirection === "horizontal") {
        let cursor = { ...origin };
        const nextLineCursor = {
          left: layoutContext.spacing.padding,
          top: origin.top + lineHeight + layoutContext.spacing.lineSpacing,
        };
        const rectangles: Rectangle[] = [
          {
            left: origin.left,
            top: origin.top,
            right: origin.left,
            bottom: origin.top,
          },
        ];
        const children = [];
        for (const child of sentenceStructureDiagramModelNode.children) {
          const childResult = (() => {
            switch (child.type) {
              case "coordination-part":
                return createSentenceStructureDiagramLayoutNode(
                  child,
                  cursor,
                  nextLineCursor.top -
                    layoutContext.spacing.lineSpacing -
                    cursor.top,
                  layoutContext,
                );
              default:
                child.type satisfies never;
                throw new Error("Unreachable");
            }
          })();

          cursor = {
            left:
              childResult.rectangles.at(-1)!.right +
              layoutContext.spacing.wordSpacing,
            top: childResult.rectangles.at(-1)!.top,
          };
          nextLineCursor.top = Math.max(
            nextLineCursor.top,
            ...childResult.rectangles.map(
              (rectangle) =>
                rectangle.bottom + layoutContext.spacing.lineSpacing,
            ),
          );
          for (const rectangle of childResult.rectangles) {
            if (rectangle.top === rectangles.at(-1)!.top) {
              rectangles.at(-1)!.right = rectangle.right;
              rectangles.at(-1)!.bottom = Math.max(
                rectangles.at(-1)!.bottom,
                rectangle.bottom,
              );
            } else {
              rectangles.push({
                left: rectangle.left,
                top: rectangle.top,
                right: rectangle.right,
                bottom: rectangle.bottom,
              });
            }
          }
          children.push(childResult);
        }

        switch (sentenceStructureDiagramModelNode.type) {
          case "coordination":
            return {
              type: "coordination",
              id: sentenceStructureDiagramModelNode.id,
              rectangles,
              children,
            };
          default:
            sentenceStructureDiagramModelNode satisfies never;
            throw new Error("Unreachable");
        }
      } else {
        const coordinationGroupIndicatorReservedWidth = layoutContext
          .coordination.groupIndicator
          ? coordinationGroupIndicatorMetrics.vertical.groupIndicatorOffsetX +
            coordinationGroupIndicatorMetrics.vertical.groupIndicatorWidth
          : 0;
        const cursor = {
          left: origin.left + coordinationGroupIndicatorReservedWidth,
          top: origin.top,
        };
        const children = [];
        for (const child of sentenceStructureDiagramModelNode.children) {
          const childResult = (() => {
            switch (child.type) {
              case "coordination-part":
                return createSentenceStructureDiagramLayoutNode(
                  child,
                  cursor,
                  0,
                  layoutContext,
                );
              default:
                child.type satisfies never;
                throw new Error("Unreachable");
            }
          })();

          cursor.top =
            Math.max(
              ...childResult.rectangles.map((rectangle) => rectangle.bottom),
            ) + layoutContext.spacing.lineSpacing;
          children.push(childResult);
        }

        return {
          type: "coordination",
          id: sentenceStructureDiagramModelNode.id,
          rectangles: [
            {
              left: origin.left,
              top: origin.top,
              right: Math.max(
                ...children.flatMap((child) =>
                  child.rectangles.map((rectangle) => rectangle.right),
                ),
              ),
              bottom: cursor.top - layoutContext.spacing.lineSpacing,
            },
          ],
          children,
        };
      }
    default:
      sentenceStructureDiagramModelNode satisfies never;
      throw new Error("Unreachable");
  }
}

function createSentenceStructureDiagramLayoutSentenceTree(
  sentenceStructureDiagramModelSentenceTree: SentenceStructureDiagramModelSentenceTree,
  origin: { left: number; top: number },
  lineHeight: number,
  layoutContext: LayoutContext,
): SentenceStructureDiagramLayoutSentenceTree {
  return {
    id: sentenceStructureDiagramModelSentenceTree.id,
    root: createSentenceStructureDiagramLayoutNode(
      sentenceStructureDiagramModelSentenceTree.root,
      origin,
      lineHeight,
      layoutContext,
    ),
    modifications: sentenceStructureDiagramModelSentenceTree.modifications,
  };
}

export function createSentenceStructureDiagramLayoutTree(
  sentenceStructureDiagramModelTree: SentenceStructureDiagramModelForest,
  measureTextWidth: (text: string, fontSize: number) => number,
): SentenceStructureDiagramLayoutTree {
  const layoutContext: LayoutContext = !sentenceStructureDiagramModelTree
    .layoutSettings.enableReflow
    ? {
        canvas: sentenceStructureDiagramModelTree.layoutSettings.canvas,
        spacing: sentenceStructureDiagramModelTree.layoutSettings.spacing,
        enableReflow: false,
        coordination: {
          layoutDirection:
            sentenceStructureDiagramModelTree.layoutSettings.coordination
              .layoutDirection,
          groupIndicator:
            sentenceStructureDiagramModelTree.layoutSettings.coordination
              .groupIndicator,
        },
        measureTextWidth,
      }
    : {
        canvas: sentenceStructureDiagramModelTree.layoutSettings.canvas,
        spacing: sentenceStructureDiagramModelTree.layoutSettings.spacing,
        enableReflow: true,
        coordination: {
          layoutDirection:
            sentenceStructureDiagramModelTree.layoutSettings.coordination
              .layoutDirection,
          groupIndicator:
            sentenceStructureDiagramModelTree.layoutSettings.coordination
              .groupIndicator,
        },
        layoutStrategy:
          sentenceStructureDiagramModelTree.layoutSettings.layoutStrategy,
        measureTextWidth,
      };

  let cursor = {
    left: layoutContext.spacing.padding,
    top: layoutContext.spacing.padding,
  };
  let currentLineBottom = cursor.top;
  const sentences = [];
  for (const sentence of sentenceStructureDiagramModelTree.sentences) {
    const sentenceResult = createSentenceStructureDiagramLayoutSentenceTree(
      sentence,
      cursor,
      currentLineBottom - cursor.top,
      layoutContext,
    );
    sentences.push(sentenceResult);

    currentLineBottom = Math.max(
      currentLineBottom,
      ...sentenceResult.root.rectangles.map((rectangle) => rectangle.bottom),
    );
    cursor =
      layoutContext.enableReflow &&
      layoutContext.layoutStrategy.lineBreakStrategy ===
        "largest-boundary-first" &&
      layoutContext.layoutStrategy.continuationLineStart === "scope-start"
        ? {
            left: layoutContext.spacing.padding,
            top: currentLineBottom + layoutContext.spacing.lineSpacing,
          }
        : {
            left:
              sentenceResult.root.rectangles.at(-1)!.right +
              layoutContext.spacing.wordSpacing,
            top: sentenceResult.root.rectangles.at(-1)!.top,
          };
  }

  return {
    canvas: {
      width: sentenceStructureDiagramModelTree.layoutSettings.canvas.width,
      height:
        currentLineBottom +
        sentenceStructureDiagramModelTree.layoutSettings.spacing.padding,
    },
    layoutSettings:
      sentenceStructureDiagramModelTree.layoutSettings.coordination
        .layoutDirection === "horizontal"
        ? {
            coordination: {
              layoutDirection:
                sentenceStructureDiagramModelTree.layoutSettings.coordination
                  .layoutDirection,
              groupIndicator:
                sentenceStructureDiagramModelTree.layoutSettings.coordination
                  .groupIndicator,
            },
          }
        : {
            coordination: {
              layoutDirection:
                sentenceStructureDiagramModelTree.layoutSettings.coordination
                  .layoutDirection,
              groupIndicator:
                sentenceStructureDiagramModelTree.layoutSettings.coordination
                  .groupIndicator,
            },
          },
    sentences,
  };
}
