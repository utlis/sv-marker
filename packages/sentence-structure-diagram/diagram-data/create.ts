import {
  boxRangeMarkerMetrics,
  coordinationGroupIndicatorMetrics,
  modificationArrowMetrics,
  sentenceStructureElementLabelMetrics,
  underlineRangeMarkerMetrics,
} from "../constants.js";
import type {
  SentenceStructureDiagramLayoutCoordinationNode,
  SentenceStructureDiagramLayoutCoordinationPartNode,
  SentenceStructureDiagramLayoutModification,
  SentenceStructureDiagramLayoutNode,
  SentenceStructureDiagramLayoutSentenceStructureElementNode,
  SentenceStructureDiagramLayoutTree,
  SentenceStructureDiagramLayoutWordNode,
} from "../diagram-layout/types.js";
import type { PathCommand, SentenceStructureDiagramData } from "./types.js";

function createWord(
  sentenceStructureDiagramLayoutWordNode: SentenceStructureDiagramLayoutWordNode,
): SentenceStructureDiagramData["words"][number] {
  return {
    id: sentenceStructureDiagramLayoutWordNode.id,
    text:
      sentenceStructureDiagramLayoutWordNode.text +
      sentenceStructureDiagramLayoutWordNode.whitespaceAfter,
    rectangle: {
      x: sentenceStructureDiagramLayoutWordNode.rectangle.left,
      y: sentenceStructureDiagramLayoutWordNode.rectangle.top,
    },
    style: sentenceStructureDiagramLayoutWordNode.style,
  };
}

function createUnderline(
  sentenceStructureDiagramLayoutNode:
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationPartNode,
): SentenceStructureDiagramData["underlines"][number] {
  if (sentenceStructureDiagramLayoutNode.rangeMarker?.type !== "underline") {
    throw new Error("Unreachable");
  }

  function getMaxUnderlineNestingDepth(
    node: SentenceStructureDiagramLayoutNode,
  ): number {
    if (node.type === "word") {
      return 0;
    }

    return (
      Math.max(...node.children.map(getMaxUnderlineNestingDepth)) +
      ("rangeMarker" in node && node.rangeMarker?.type === "underline" ? 1 : 0)
    );
  }

  return {
    id: sentenceStructureDiagramLayoutNode.id,
    lineSegments: sentenceStructureDiagramLayoutNode.rectangles.map(
      (rectangle) => ({
        x1: rectangle.left,
        x2: rectangle.right,
        y:
          rectangle.bottom +
          underlineRangeMarkerMetrics.underlineOffsetY +
          (getMaxUnderlineNestingDepth(sentenceStructureDiagramLayoutNode) -
            1) *
            (underlineRangeMarkerMetrics.underlineOffsetY +
              underlineRangeMarkerMetrics.strokeWidth),
      }),
    ),
    style: {
      ...sentenceStructureDiagramLayoutNode.rangeMarker.style,
      strokeWidth: underlineRangeMarkerMetrics.strokeWidth,
    },
  };
}

function createBracket(
  sentenceStructureDiagramLayoutNode:
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationPartNode,
): SentenceStructureDiagramData["brackets"][number] {
  if (sentenceStructureDiagramLayoutNode.rangeMarker?.type !== "bracket") {
    throw new Error("Unreachable");
  }

  return {
    id: sentenceStructureDiagramLayoutNode.id,
    openingBracket: {
      text: sentenceStructureDiagramLayoutNode.rangeMarker.openingBracket.text,
      x: sentenceStructureDiagramLayoutNode.rangeMarker.openingBracket.left,
      y: sentenceStructureDiagramLayoutNode.rangeMarker.openingBracket.top,
    },
    closingBracket: {
      text: sentenceStructureDiagramLayoutNode.rangeMarker.closingBracket.text,
      x: sentenceStructureDiagramLayoutNode.rangeMarker.closingBracket.left,
      y: sentenceStructureDiagramLayoutNode.rangeMarker.closingBracket.top,
    },
    style: sentenceStructureDiagramLayoutNode.rangeMarker.style,
  };
}

function createBox(
  sentenceStructureDiagramLayoutNode:
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationPartNode,
): SentenceStructureDiagramData["boxes"][number] {
  if (sentenceStructureDiagramLayoutNode.rangeMarker?.type !== "box") {
    throw new Error("Unreachable");
  }

  return {
    id: sentenceStructureDiagramLayoutNode.id,
    linePaths: sentenceStructureDiagramLayoutNode.rectangles.map(
      (rectangle, index) => {
        if (
          index === 0 &&
          sentenceStructureDiagramLayoutNode.rectangles.length === 1
        ) {
          return {
            pathCommands: [
              {
                type: "move-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "close-path",
              },
            ],
          };
        } else if (index === 0) {
          return {
            pathCommands: [
              {
                type: "move-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
            ],
          };
        } else if (
          index ===
          sentenceStructureDiagramLayoutNode.rectangles.length - 1
        ) {
          return {
            pathCommands: [
              {
                type: "move-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
            ],
          };
        } else {
          return {
            pathCommands: [
              {
                type: "move-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.top - boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "move-to",
                to: {
                  x: rectangle.left - boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
              {
                type: "line-to",
                to: {
                  x: rectangle.right + boxRangeMarkerMetrics.outlineOffset,
                  y: rectangle.bottom + boxRangeMarkerMetrics.outlineOffset,
                },
              },
            ],
          };
        }
      },
    ),
    style: {
      ...sentenceStructureDiagramLayoutNode.rangeMarker.style,
      strokeWidth: boxRangeMarkerMetrics.strokeWidth,
    },
  };
}

function createHighlight(
  sentenceStructureDiagramLayoutNode:
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationPartNode,
): SentenceStructureDiagramData["highlights"][number] {
  if (sentenceStructureDiagramLayoutNode.rangeMarker?.type !== "highlight") {
    throw new Error("Unreachable");
  }

  return {
    id: sentenceStructureDiagramLayoutNode.id,
    lineRectangles: sentenceStructureDiagramLayoutNode.rectangles.map(
      (rectangle) => ({
        x: rectangle.left,
        y: rectangle.top,
        width: rectangle.right - rectangle.left,
        height: rectangle.bottom - rectangle.top,
      }),
    ),
    style: sentenceStructureDiagramLayoutNode.rangeMarker.style,
  };
}

function createSentenceElementLabel(
  sentenceStructureDiagramLayoutSentenceStructureElementNode: SentenceStructureDiagramLayoutSentenceStructureElementNode,
): SentenceStructureDiagramData["sentenceElementLabels"][number] {
  if (
    !sentenceStructureDiagramLayoutSentenceStructureElementNode.sentenceElementLabel
  ) {
    throw new Error("Unreachable");
  }

  const firstLineRectangle =
    sentenceStructureDiagramLayoutSentenceStructureElementNode.rectangles.at(
      0,
    )!;

  switch (
    sentenceStructureDiagramLayoutSentenceStructureElementNode
      .sentenceElementLabel.placement
  ) {
    case "below-center":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceElementLabel.text,
        x: (firstLineRectangle.left + firstLineRectangle.right) / 2,
        y:
          firstLineRectangle.bottom +
          sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "center",
        anchorY: "top",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceElementLabel.style,
      };
    case "below-left":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceElementLabel.text,
        x: firstLineRectangle.left,
        y:
          firstLineRectangle.bottom +
          sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "left",
        anchorY: "top",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceElementLabel.style,
      };
    case "above-center":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceElementLabel.text,
        x: (firstLineRectangle.left + firstLineRectangle.right) / 2,
        y:
          firstLineRectangle.top - sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "center",
        anchorY: "bottom",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceElementLabel.style,
      };
    case "above-left":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceElementLabel.text,
        x: firstLineRectangle.left,
        y:
          firstLineRectangle.top - sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "left",
        anchorY: "bottom",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceElementLabel.style,
      };
    default:
      sentenceStructureDiagramLayoutSentenceStructureElementNode
        .sentenceElementLabel.placement satisfies never;
      throw new Error("Unreachable");
  }
}

function createSentenceConstituentLabel(
  sentenceStructureDiagramLayoutSentenceStructureElementNode: SentenceStructureDiagramLayoutSentenceStructureElementNode,
): SentenceStructureDiagramData["sentenceConstituentLabels"][number] {
  if (
    !sentenceStructureDiagramLayoutSentenceStructureElementNode.sentenceConstituentLabel
  ) {
    throw new Error("Unreachable");
  }

  const firstLineRectangle =
    sentenceStructureDiagramLayoutSentenceStructureElementNode.rectangles.at(
      0,
    )!;

  switch (
    sentenceStructureDiagramLayoutSentenceStructureElementNode
      .sentenceConstituentLabel.placement
  ) {
    case "below-center":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceConstituentLabel.text,
        x: (firstLineRectangle.left + firstLineRectangle.right) / 2,
        y:
          firstLineRectangle.bottom +
          sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "center",
        anchorY: "top",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceConstituentLabel.style,
      };
    case "below-left":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceConstituentLabel.text,
        x: firstLineRectangle.left,
        y:
          firstLineRectangle.bottom +
          sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "left",
        anchorY: "top",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceConstituentLabel.style,
      };
    case "above-center":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceConstituentLabel.text,
        x: (firstLineRectangle.left + firstLineRectangle.right) / 2,
        y:
          firstLineRectangle.top - sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "center",
        anchorY: "bottom",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceConstituentLabel.style,
      };
    case "above-left":
      return {
        id: sentenceStructureDiagramLayoutSentenceStructureElementNode.id,
        text: sentenceStructureDiagramLayoutSentenceStructureElementNode
          .sentenceConstituentLabel.text,
        x: firstLineRectangle.left,
        y:
          firstLineRectangle.top - sentenceStructureElementLabelMetrics.offsetY,
        anchorX: "left",
        anchorY: "bottom",
        style:
          sentenceStructureDiagramLayoutSentenceStructureElementNode
            .sentenceConstituentLabel.style,
      };
    default:
      sentenceStructureDiagramLayoutSentenceStructureElementNode
        .sentenceConstituentLabel.placement satisfies never;
      throw new Error("Unreachable");
  }
}

function createArrow(
  sentenceStructureDiagramLayoutModification: SentenceStructureDiagramLayoutModification,
  modifierSentenceStructureDiagramLayoutSentenceStructureElementNode: SentenceStructureDiagramLayoutSentenceStructureElementNode,
  modifiedSentenceStructureDiagramLayoutSentenceStructureElementNode: SentenceStructureDiagramLayoutSentenceStructureElementNode,
): SentenceStructureDiagramData["arrows"][number] {
  const { fromEndpoint, toEndpoint } = (() => {
    function getArrowEndpointCandidates(
      sentenceStructureDiagramLayoutNode: SentenceStructureDiagramLayoutNode,
    ): { x: number; y: number }[] {
      if (sentenceStructureDiagramLayoutNode.type === "word") {
        return [
          {
            x:
              (sentenceStructureDiagramLayoutNode.rectangle.left +
                sentenceStructureDiagramLayoutNode.rectangle.right) /
              2,
            y: sentenceStructureDiagramLayoutNode.rectangle.top,
          },
        ];
      }

      return sentenceStructureDiagramLayoutNode.children.flatMap(
        getArrowEndpointCandidates,
      );
    }

    const fromEndpointCandidates = getArrowEndpointCandidates(
      modifierSentenceStructureDiagramLayoutSentenceStructureElementNode,
    );
    const toEndpointCandidates = getArrowEndpointCandidates(
      modifiedSentenceStructureDiagramLayoutSentenceStructureElementNode,
    );

    let fromEndpoint = fromEndpointCandidates.at(0)!;
    let toEndpoint = toEndpointCandidates.at(0)!;
    let minSquaredDistance =
      (fromEndpoint.x - toEndpoint.x) ** 2 +
      (fromEndpoint.y - toEndpoint.y) ** 2;
    for (const fromEndpointCandidate of fromEndpointCandidates) {
      for (const toEndpointCandidate of toEndpointCandidates) {
        const squaredDistance =
          (fromEndpointCandidate.x - toEndpointCandidate.x) ** 2 +
          (fromEndpointCandidate.y - toEndpointCandidate.y) ** 2;
        if (squaredDistance < minSquaredDistance) {
          fromEndpoint = fromEndpointCandidate;
          toEndpoint = toEndpointCandidate;
          minSquaredDistance = squaredDistance;
        }
      }
    }

    return { fromEndpoint, toEndpoint };
  })();

  const controlPointY =
    Math.min(fromEndpoint.y, toEndpoint.y) -
    modificationArrowMetrics.curvedRouteOffsetY;
  const curvedArrowShaftPathCommands: PathCommand[] = [
    {
      type: "move-to",
      to: {
        x: fromEndpoint.x,
        y: fromEndpoint.y,
      },
    },
    {
      type: "cubic-bezier-curve",
      startControlPoint: {
        x: fromEndpoint.x,
        y: controlPointY,
      },
      endControlPoint: {
        x: toEndpoint.x,
        y: controlPointY,
      },
      to: {
        x: toEndpoint.x,
        y: toEndpoint.y,
      },
    },
  ];

  const orthogonalArrowShaftPathCommands: PathCommand[] = [
    {
      type: "move-to",
      to: {
        x: fromEndpoint.x,
        y: fromEndpoint.y,
      },
    },
    {
      type: "line-to",
      to: {
        x: fromEndpoint.x,
        y: fromEndpoint.y - modificationArrowMetrics.orthogonalRouteOffsetY,
      },
    },
    {
      type: "line-to",
      to: {
        x: toEndpoint.x,
        y: toEndpoint.y - modificationArrowMetrics.orthogonalRouteOffsetY,
      },
    },
    {
      type: "line-to",
      to: {
        x: toEndpoint.x,
        y: toEndpoint.y,
      },
    },
  ];

  const arrowheadPathCommands: PathCommand[] = [
    {
      type: "move-to",
      to: {
        x: toEndpoint.x - modificationArrowMetrics.arrowheadSize,
        y: toEndpoint.y - modificationArrowMetrics.arrowheadSize,
      },
    },
    {
      type: "line-to",
      to: {
        x: toEndpoint.x,
        y: toEndpoint.y,
      },
    },
    {
      type: "line-to",
      to: {
        x: toEndpoint.x + modificationArrowMetrics.arrowheadSize,
        y: toEndpoint.y - modificationArrowMetrics.arrowheadSize,
      },
    },
  ];

  switch (sentenceStructureDiagramLayoutModification.arrow.type) {
    case "curved":
      return {
        id: sentenceStructureDiagramLayoutModification.id,
        pathCommands: [
          ...curvedArrowShaftPathCommands,
          ...arrowheadPathCommands,
        ],
        style: {
          ...sentenceStructureDiagramLayoutModification.arrow.style,
          strokeWidth: modificationArrowMetrics.strokeWidth,
        },
      };
    case "orthogonal":
      if (fromEndpoint.y === toEndpoint.y) {
        return {
          id: sentenceStructureDiagramLayoutModification.id,
          pathCommands: [
            ...orthogonalArrowShaftPathCommands,
            ...arrowheadPathCommands,
          ],
          style: {
            ...sentenceStructureDiagramLayoutModification.arrow.style,
            strokeWidth: modificationArrowMetrics.strokeWidth,
          },
        };
      } else {
        return {
          id: sentenceStructureDiagramLayoutModification.id,
          pathCommands: [
            ...curvedArrowShaftPathCommands,
            ...arrowheadPathCommands,
          ],
          style: {
            ...sentenceStructureDiagramLayoutModification.arrow.style,
            strokeWidth: modificationArrowMetrics.strokeWidth,
          },
        };
      }
    default:
      sentenceStructureDiagramLayoutModification.arrow.type satisfies never;
      throw new Error("Unreachable");
  }
}

function createCoordinationGroupIndicator(
  sentenceStructureDiagramLayoutCoordinationNode: SentenceStructureDiagramLayoutCoordinationNode,
  layoutSettings: SentenceStructureDiagramLayoutTree["layoutSettings"],
): SentenceStructureDiagramData["coordinationGroupIndicators"][number] {
  if (!layoutSettings.coordination.groupIndicator) {
    throw new Error("Unreachable");
  }

  function getMaxCoordinationNestingDepth(
    node: SentenceStructureDiagramLayoutNode,
  ): number {
    if (node.type === "word") {
      return 0;
    }

    return (
      Math.max(...node.children.map(getMaxCoordinationNestingDepth)) +
      (node.type === "coordination" ? 1 : 0)
    );
  }

  if (layoutSettings.coordination.layoutDirection === "horizontal") {
    switch (layoutSettings.coordination.groupIndicator.type) {
      case "bus-connector":
        const attachmentPoints =
          sentenceStructureDiagramLayoutCoordinationNode.children.map(
            (coordinationPartNode) => {
              const widestRectangle = coordinationPartNode.rectangles
                .sort((a, b) => b.right - b.left - (a.right - a.left))
                .at(0)!;
              return {
                x: (widestRectangle.left + widestRectangle.right) / 2,
                y: widestRectangle.top,
              };
            },
          );

        const attachmentPointsByLine: {
          attachmentPoints: {
            x: number;
            y: number;
          }[];
        }[] = [];
        for (const [index, attachmentPoint] of attachmentPoints.entries()) {
          if (
            index === 0 ||
            attachmentPoint.y !==
              attachmentPointsByLine.at(-1)!.attachmentPoints.at(0)!.y
          ) {
            attachmentPointsByLine.push({
              attachmentPoints: [
                {
                  x: attachmentPoint.x,
                  y: attachmentPoint.y,
                },
              ],
            });
          } else {
            attachmentPointsByLine
              .at(-1)!
              .attachmentPoints.push(attachmentPoint);
          }
        }

        return {
          id: sentenceStructureDiagramLayoutCoordinationNode.id,
          linePaths: attachmentPointsByLine.map(
            (attachmentPointsOnLine, index) => {
              const attachmentPointY =
                attachmentPointsOnLine.attachmentPoints.at(0)!.y -
                coordinationGroupIndicatorMetrics.horizontal.busConnector
                  .attachmentPointOffsetY;
              const busLineY =
                attachmentPointY -
                coordinationGroupIndicatorMetrics.horizontal.busConnector
                  .tapLineBaseHeight -
                (getMaxCoordinationNestingDepth(
                  sentenceStructureDiagramLayoutCoordinationNode,
                ) -
                  1) *
                  coordinationGroupIndicatorMetrics.horizontal.busConnector
                    .tapLineNestingStepY;
              const lineRectangle =
                sentenceStructureDiagramLayoutCoordinationNode.rectangles.find(
                  (rectangle) =>
                    rectangle.top ===
                    attachmentPointsOnLine.attachmentPoints.at(0)!.y,
                )!;
              if (attachmentPointsByLine.length === 1) {
                return {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(0)!.x,
                        y: attachmentPointY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(0)!.x,
                        y: busLineY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(-1)!.x,
                        y: busLineY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(-1)!.x,
                        y: attachmentPointY,
                      },
                    },
                    ...(attachmentPointsOnLine.attachmentPoints
                      .slice(1, -1)
                      .flatMap((attachmentPoint) => [
                        {
                          type: "move-to",
                          to: {
                            x: attachmentPoint.x,
                            y: attachmentPointY,
                          },
                        },
                        {
                          type: "line-to",
                          to: {
                            x: attachmentPoint.x,
                            y: busLineY,
                          },
                        },
                      ]) satisfies PathCommand[]),
                  ],
                };
              }
              if (index === 0) {
                return {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(0)!.x,
                        y: attachmentPointY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(0)!.x,
                        y: busLineY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: lineRectangle.right,
                        y: busLineY,
                      },
                    },
                    ...(attachmentPointsOnLine.attachmentPoints
                      .slice(1)
                      .flatMap((attachmentPoint) => [
                        {
                          type: "move-to",
                          to: {
                            x: attachmentPoint.x,
                            y: attachmentPointY,
                          },
                        },
                        {
                          type: "line-to",
                          to: {
                            x: attachmentPoint.x,
                            y: busLineY,
                          },
                        },
                      ]) satisfies PathCommand[]),
                  ],
                };
              }
              if (index === attachmentPointsByLine.length - 1) {
                return {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x: lineRectangle.left,
                        y: busLineY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(-1)!.x,
                        y: busLineY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: attachmentPointsOnLine.attachmentPoints.at(-1)!.x,
                        y: attachmentPointY,
                      },
                    },
                    ...(attachmentPointsOnLine.attachmentPoints
                      .slice(0, -1)
                      .flatMap((attachmentPoint) => [
                        {
                          type: "move-to",
                          to: {
                            x: attachmentPoint.x,
                            y: attachmentPointY,
                          },
                        },
                        {
                          type: "line-to",
                          to: {
                            x: attachmentPoint.x,
                            y: busLineY,
                          },
                        },
                      ]) satisfies PathCommand[]),
                  ],
                };
              }
              return {
                pathCommands: [
                  {
                    type: "move-to",
                    to: {
                      x: lineRectangle.left,
                      y: busLineY,
                    },
                  },
                  {
                    type: "line-to",
                    to: {
                      x: lineRectangle.right,
                      y: busLineY,
                    },
                  },
                  ...(attachmentPointsOnLine.attachmentPoints.flatMap(
                    (attachmentPoint) => [
                      {
                        type: "move-to",
                        to: {
                          x: attachmentPoint.x,
                          y: attachmentPointY,
                        },
                      },
                      {
                        type: "line-to",
                        to: {
                          x: attachmentPoint.x,
                          y: busLineY,
                        },
                      },
                    ],
                  ) satisfies PathCommand[]),
                ],
              };
            },
          ),
          style: {
            ...layoutSettings.coordination.groupIndicator.style,
            strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
          },
        };
      default:
        layoutSettings.coordination.groupIndicator.type satisfies never;
        throw new Error("Unreachable");
    }
  } else {
    if (
      sentenceStructureDiagramLayoutCoordinationNode.rectangles.length !== 1
    ) {
      throw new Error(
        "Vertical coordination node must have a single rectangle",
      );
    }
    const sentenceStructureDiagramLayoutCoordinationNodeRectangle =
      sentenceStructureDiagramLayoutCoordinationNode.rectangles[0]!;
    switch (layoutSettings.coordination.groupIndicator.type) {
      case "bracket":
        switch (layoutSettings.coordination.groupIndicator.bracketType) {
          case "parenthesis":
            return {
              id: sentenceStructureDiagramLayoutCoordinationNode.id,
              linePaths: [
                {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                      to: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          2,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                  ],
                },
                ...(layoutSettings.coordination.groupIndicator.placement ===
                "both-sides"
                  ? [
                      {
                        pathCommands: [
                          {
                            type: "move-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                2,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                        ] satisfies PathCommand[],
                      },
                    ]
                  : []),
              ],
              style: {
                ...layoutSettings.coordination.groupIndicator.style,
                strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
              },
            };
          case "angle-bracket":
            return {
              id: sentenceStructureDiagramLayoutCoordinationNode.id,
              linePaths: [
                {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          2,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                  ],
                },
                ...(layoutSettings.coordination.groupIndicator.placement ===
                "both-sides"
                  ? [
                      {
                        pathCommands: [
                          {
                            type: "move-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "line-to",
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                2,
                            },
                          },
                          {
                            type: "line-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                        ] satisfies PathCommand[],
                      },
                    ]
                  : []),
              ],
              style: {
                ...layoutSettings.coordination.groupIndicator.style,
                strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
              },
            };
          case "curly-bracket":
            return {
              id: sentenceStructureDiagramLayoutCoordinationNode.id,
              linePaths: [
                {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top *
                            3 +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          4,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          2,
                      },
                      to: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          2,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                          2,
                      },
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                            sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom *
                              3) /
                          4,
                      },
                    },
                    {
                      type: "quadratic-bezier-curve",
                      controlPoint: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth /
                            2,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                  ],
                },
                ...(layoutSettings.coordination.groupIndicator.placement ===
                "both-sides"
                  ? [
                      {
                        pathCommands: [
                          {
                            type: "move-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top *
                                  3 +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                4,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                2,
                            },
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                2,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom) /
                                2,
                            },
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                (sentenceStructureDiagramLayoutCoordinationNodeRectangle.top +
                                  sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom *
                                    3) /
                                4,
                            },
                          },
                          {
                            type: "quadratic-bezier-curve",
                            controlPoint: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth /
                                  2,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                        ] satisfies PathCommand[],
                      },
                    ]
                  : []),
              ],
              style: {
                ...layoutSettings.coordination.groupIndicator.style,
                strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
              },
            };
          case "square-bracket":
            return {
              id: sentenceStructureDiagramLayoutCoordinationNode.id,
              linePaths: [
                {
                  pathCommands: [
                    {
                      type: "move-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.left,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                    {
                      type: "line-to",
                      to: {
                        x:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                          coordinationGroupIndicatorMetrics.vertical
                            .groupIndicatorWidth,
                        y:
                          sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                          coordinationGroupIndicatorMetrics.vertical.bracket
                            .offsetY,
                      },
                    },
                  ],
                },
                ...(layoutSettings.coordination.groupIndicator.placement ===
                "both-sides"
                  ? [
                      {
                        pathCommands: [
                          {
                            type: "move-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "line-to",
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.top -
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "line-to",
                            to: {
                              x: sentenceStructureDiagramLayoutCoordinationNodeRectangle.right,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                          {
                            type: "line-to",
                            to: {
                              x:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.right -
                                coordinationGroupIndicatorMetrics.vertical
                                  .groupIndicatorWidth,
                              y:
                                sentenceStructureDiagramLayoutCoordinationNodeRectangle.bottom +
                                coordinationGroupIndicatorMetrics.vertical
                                  .bracket.offsetY,
                            },
                          },
                        ] satisfies PathCommand[],
                      },
                    ]
                  : []),
              ],
              style: {
                ...layoutSettings.coordination.groupIndicator.style,
                strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
              },
            };
          default:
            layoutSettings.coordination.groupIndicator
              .bracketType satisfies never;
            throw new Error("Unreachable");
        }
      case "bus-connector":
        const attachmentPoints =
          sentenceStructureDiagramLayoutCoordinationNode.children.map(
            (coordinationPartNode) => ({
              x:
                sentenceStructureDiagramLayoutCoordinationNodeRectangle.left +
                coordinationGroupIndicatorMetrics.vertical.groupIndicatorWidth,
              y:
                (coordinationPartNode.rectangles.at(0)!.top +
                  coordinationPartNode.rectangles.at(0)!.bottom) /
                2,
            }),
          );
        return {
          id: sentenceStructureDiagramLayoutCoordinationNode.id,
          linePaths: [
            {
              pathCommands: [
                {
                  type: "move-to",
                  to: {
                    x: attachmentPoints.at(0)!.x,
                    y: attachmentPoints.at(0)!.y,
                  },
                },
                {
                  type: "line-to",
                  to: {
                    x:
                      attachmentPoints.at(0)!.x -
                      coordinationGroupIndicatorMetrics.vertical
                        .groupIndicatorWidth,
                    y: attachmentPoints.at(0)!.y,
                  },
                },
                {
                  type: "line-to",
                  to: {
                    x:
                      attachmentPoints.at(-1)!.x -
                      coordinationGroupIndicatorMetrics.vertical
                        .groupIndicatorWidth,
                    y: attachmentPoints.at(-1)!.y,
                  },
                },
                {
                  type: "line-to",
                  to: {
                    x: attachmentPoints.at(-1)!.x,
                    y: attachmentPoints.at(-1)!.y,
                  },
                },
                ...attachmentPoints.slice(1, -1).flatMap(
                  (attachmentPoint) =>
                    [
                      {
                        type: "move-to",
                        to: {
                          x: attachmentPoint.x,
                          y: attachmentPoint.y,
                        },
                      },
                      {
                        type: "line-to",
                        to: {
                          x:
                            attachmentPoint.x -
                            coordinationGroupIndicatorMetrics.vertical
                              .groupIndicatorWidth,
                          y: attachmentPoint.y,
                        },
                      },
                    ] satisfies PathCommand[],
                ),
              ],
            },
          ],
          style: {
            ...layoutSettings.coordination.groupIndicator.style,
            strokeWidth: coordinationGroupIndicatorMetrics.strokeWidth,
          },
        };
      default:
        layoutSettings.coordination.groupIndicator satisfies never;
        throw new Error("Unreachable");
    }
  }
}

export function createSentenceStructureDiagramData(
  sentenceStructureDiagramLayoutTree: SentenceStructureDiagramLayoutTree,
): SentenceStructureDiagramData {
  const words: SentenceStructureDiagramData["words"] = [];
  const underlines: SentenceStructureDiagramData["underlines"] = [];
  const brackets: SentenceStructureDiagramData["brackets"] = [];
  const boxes: SentenceStructureDiagramData["boxes"] = [];
  const highlights: SentenceStructureDiagramData["highlights"] = [];
  const sentenceElementLabels: SentenceStructureDiagramData["sentenceElementLabels"] =
    [];
  const sentenceConstituentLabels: SentenceStructureDiagramData["sentenceConstituentLabels"] =
    [];
  const coordinationGroupIndicators: SentenceStructureDiagramData["coordinationGroupIndicators"] =
    [];

  const sentenceStructureElementIdToSentenceStructureDiagramLayoutSentenceStructureElementNodeMap: Map<
    string,
    SentenceStructureDiagramLayoutSentenceStructureElementNode
  > = new Map();

  function visit(node: SentenceStructureDiagramLayoutNode) {
    switch (node.type) {
      case "word":
        words.push(createWord(node));
        return;
      case "sentence-structure-element":
        if (node.rangeMarker) {
          switch (node.rangeMarker.type) {
            case "underline":
              underlines.push(createUnderline(node));
              break;
            case "bracket":
              brackets.push(createBracket(node));
              break;
            case "box":
              boxes.push(createBox(node));
              break;
            case "highlight":
              highlights.push(createHighlight(node));
              break;
            default:
              node.rangeMarker satisfies never;
              throw new Error("Unreachable");
          }
        }
        if (node.sentenceElementLabel) {
          sentenceElementLabels.push(createSentenceElementLabel(node));
        }
        if (node.sentenceConstituentLabel) {
          sentenceConstituentLabels.push(createSentenceConstituentLabel(node));
        }
        sentenceStructureElementIdToSentenceStructureDiagramLayoutSentenceStructureElementNodeMap.set(
          node.id,
          node,
        );
        break;
      case "coordination-part":
        if (node.rangeMarker) {
          switch (node.rangeMarker.type) {
            case "underline":
              underlines.push(createUnderline(node));
              break;
            case "bracket":
              brackets.push(createBracket(node));
              break;
            case "box":
              boxes.push(createBox(node));
              break;
            case "highlight":
              highlights.push(createHighlight(node));
              break;
            default:
              node.rangeMarker satisfies never;
              throw new Error("Unreachable");
          }
        }
        break;
      case "coordination":
        if (
          sentenceStructureDiagramLayoutTree.layoutSettings.coordination
            .groupIndicator
        ) {
          coordinationGroupIndicators.push(
            createCoordinationGroupIndicator(
              node,
              sentenceStructureDiagramLayoutTree.layoutSettings,
            ),
          );
        }
        break;
      case "root":
        break;
      default:
        node satisfies never;
        throw new Error("Unreachable");
    }

    for (const child of node.children) {
      visit(child);
    }
  }

  for (const sentenceStructureDiagramLayoutSentenceTree of sentenceStructureDiagramLayoutTree.sentences) {
    visit(sentenceStructureDiagramLayoutSentenceTree.root);
  }

  return {
    canvas: sentenceStructureDiagramLayoutTree.canvas,
    words,
    underlines,
    brackets,
    boxes,
    highlights,
    sentenceElementLabels,
    sentenceConstituentLabels,
    arrows: sentenceStructureDiagramLayoutTree.sentences.flatMap(
      (sentenceStructureDiagramLayoutSentenceTree) =>
        sentenceStructureDiagramLayoutSentenceTree.modifications.map(
          (modification) =>
            createArrow(
              modification,
              sentenceStructureElementIdToSentenceStructureDiagramLayoutSentenceStructureElementNodeMap.get(
                modification.modifierSentenceStructureElementNodeId,
              )!,
              sentenceStructureElementIdToSentenceStructureDiagramLayoutSentenceStructureElementNodeMap.get(
                modification.modifiedSentenceStructureElementNodeId,
              )!,
            ),
        ),
    ),
    coordinationGroupIndicators,
  };
}
