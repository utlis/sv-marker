import type {
  SentenceElementName,
  SentenceStructureRangeType,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import {
  defaultConfigurations,
  type BracketName,
  type Configurations,
  type LayoutMode,
  type RelationShapeType,
  type SentenceElementPositionType,
} from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";

type SpanPosition = {
  start: number;
  end: number;
  top: number;
  bottom: number;
}[];

type RangePosition = SpanPosition;

type CoordinationPosition = {
  position: SpanPosition;
  childrenPositions: SpanPosition[];
};

type ResolvedConfigurations = {
  color: {
    primaryColor: string;
    textColor: string;
  };
  sentenceStructureRangeTypeToBracketsMap: Record<
    SentenceStructureRangeType,
    { openingBracket: string; closingBracket: string }
  >;
  sentenceElementNameToSentenceElementSymbolMap: Record<
    SentenceElementName,
    string
  >;
  sentenceElementPosition: {
    determineSentenceElementRangeSentenceElementPosition: (
      rangePosition: RangePosition,
    ) => { x: number; y: number };
    determineSentenceStructureRangeSentenceElementPosition: (
      rangePosition: RangePosition,
    ) => { x: number; y: number };
  };
  determineRelationSvgPathData: (
    fromRangePosition: RangePosition,
    toRangePosition: RangePosition,
  ) => string;
  determineCoordinationSvgPathData: (
    coordinationPosition: CoordinationPosition,
  ) => string;
  layoutMode: LayoutMode;
};

function convertBracketNameToBrackets(bracketName: BracketName) {
  switch (bracketName) {
    case "(parenthesis)":
      return { openingBracket: "(", closingBracket: ")" };
    case "<angle-bracket>":
      return { openingBracket: "<", closingBracket: ">" };
    case "{curly-bracket}":
      return { openingBracket: "{", closingBracket: "}" };
    case "[square-bracket]":
      return { openingBracket: "[", closingBracket: "]" };
  }
}

function determineSentenceElementPosition(
  sentenceElementPositionType: SentenceElementPositionType,
  rangePosition: RangePosition,
) {
  switch (sentenceElementPositionType) {
    case "bottom-center":
      return {
        x: (rangePosition[0]!.start + rangePosition[0]!.end) / 2,
        y: rangePosition[0]!.bottom + 8,
      };
    case "bottom-left":
      return {
        x: rangePosition[0]!.start + 6,
        y: rangePosition[0]!.bottom + 8,
      };
  }
}

function determineRelationSvgPathData(
  relationShapeType: RelationShapeType,
  fromRangePosition: RangePosition,
  toRangePosition: RangePosition,
) {
  const fromPoint = {
    x:
      fromRangePosition[0]!.start +
      (fromRangePosition[0]!.end - fromRangePosition[0]!.start) / 2,
    y: fromRangePosition[0]!.top,
  };
  const toPoint = {
    x:
      toRangePosition[0]!.start +
      (toRangePosition[0]!.end - toRangePosition[0]!.start) / 2,
    y: toRangePosition[0]!.top,
  };

  const height = 40;

  const curveTopY = Math.min(fromPoint.y, toPoint.y) - height;
  const arrowSize = 4;
  const arrowPosition = {
    left: toPoint.x - arrowSize,
    right: toPoint.x + arrowSize,
    top: toPoint.y - arrowSize,
  };
  const curveSvgPathData = [
    // 曲線
    `M ${fromPoint.x},${fromPoint.y}`,
    `C ${fromPoint.x},${curveTopY} ${toPoint.x},${curveTopY} ${toPoint.x},${toPoint.y}`,
    // 矢印
    `M ${arrowPosition.left},${arrowPosition.top}`,
    `L ${toPoint.x},${toPoint.y}`,
    `L ${arrowPosition.right},${arrowPosition.top}`,
  ].join(" ");

  const straightSvgPathData = [
    // 直線
    `M ${fromPoint.x},${fromPoint.y}`,
    `L ${fromPoint.x},${fromPoint.y - height / 2}`,
    `L ${toPoint.x},${toPoint.y - height / 2}`,
    `L ${toPoint.x},${toPoint.y}`,
    // 矢印
    `M ${arrowPosition.left},${arrowPosition.top}`,
    `L ${toPoint.x},${toPoint.y}`,
    `L ${arrowPosition.right},${arrowPosition.top}`,
  ].join(" ");

  switch (relationShapeType) {
    case "curved":
      return curveSvgPathData;
    case "right-angle":
      if (fromPoint.y === toPoint.y) {
        return straightSvgPathData;
      } else {
        return curveSvgPathData;
      }
  }
}

function determineCoordinationSvgPathData(
  layoutMode: LayoutMode,
  coordinationPosition: CoordinationPosition,
) {
  switch (layoutMode) {
    case "linear": {
      const verticalLines = coordinationPosition.childrenPositions.map(
        (position) => ({
          start: (position.at(0)!.start + position.at(0)!.end) / 2,
          top: position.at(0)!.top - 20,
          bottom: position.at(0)!.top,
        }),
      );
      const overLines = coordinationPosition.position.map(
        (position, index) => ({
          start:
            index === 0
              ? (coordinationPosition.childrenPositions.at(0)!.at(0)!.start +
                  coordinationPosition.childrenPositions.at(0)!.at(0)!.end) /
                2
              : position.start,
          end:
            index === coordinationPosition.position.length - 1
              ? (coordinationPosition.childrenPositions.at(-1)!.at(-1)!.start +
                  coordinationPosition.childrenPositions.at(-1)!.at(-1)!.end) /
                2
              : position.end,
          top: position.top - 20,
        }),
      );
      return (
        verticalLines
          .map(
            (verticalLine) =>
              `M ${verticalLine.start} ${verticalLine.top} L ${verticalLine.start} ${verticalLine.bottom}`,
          )
          .join(" ") +
        " " +
        overLines
          .map(
            (overLine) =>
              `M ${overLine.start} ${overLine.top} L ${overLine.end} ${overLine.top}`,
          )
          .join(" ")
      );
    }
    case "structured":
      const verticalLine = {
        start: coordinationPosition.position.at(0)!.start - 10,
        top:
          (coordinationPosition.position.at(0)!.top +
            coordinationPosition.position.at(0)!.bottom) /
          2,
        bottom:
          (coordinationPosition.position.at(-1)!.top +
            coordinationPosition.position.at(-1)!.bottom) /
            2 +
          8,
      };
      const topHorizontalLine = {
        start: verticalLine.start,
        end: verticalLine.start + 10,
        top: verticalLine.top,
      };
      const bottomHorizontalLine = {
        start: verticalLine.start,
        end: verticalLine.start + 10,
        top: verticalLine.bottom,
      };
      return [
        // 縦線
        `M ${verticalLine.start} ${verticalLine.top} L ${verticalLine.start} ${verticalLine.bottom}`,
        // 上の横線
        `M ${topHorizontalLine.start} ${topHorizontalLine.top} L ${topHorizontalLine.end} ${topHorizontalLine.top}`,
        // 下の横線
        `M ${bottomHorizontalLine.start} ${bottomHorizontalLine.top} L ${bottomHorizontalLine.end} ${bottomHorizontalLine.top}`,
      ].join(" ");
  }
}

export function resolveConfigurations(
  customConfigurations: Partial<Configurations>,
): ResolvedConfigurations {
  const configurations: Configurations = {
    color: customConfigurations.color
      ? customConfigurations.color
      : defaultConfigurations.color,
    sentenceStructureRangeTypeToBracketNameMap:
      customConfigurations.sentenceStructureRangeTypeToBracketNameMap
        ? customConfigurations.sentenceStructureRangeTypeToBracketNameMap
        : defaultConfigurations.sentenceStructureRangeTypeToBracketNameMap,
    sentenceElementNameToSentenceElementSymbolMap:
      customConfigurations.sentenceElementNameToSentenceElementSymbolMap
        ? customConfigurations.sentenceElementNameToSentenceElementSymbolMap
        : defaultConfigurations.sentenceElementNameToSentenceElementSymbolMap,
    sentenceElementPositionType:
      customConfigurations.sentenceElementPositionType
        ? customConfigurations.sentenceElementPositionType
        : defaultConfigurations.sentenceElementPositionType,
    relationShapeType: customConfigurations.relationShapeType
      ? customConfigurations.relationShapeType
      : defaultConfigurations.relationShapeType,
    layoutMode: customConfigurations.layoutMode
      ? customConfigurations.layoutMode
      : defaultConfigurations.layoutMode,
  };

  return {
    color: configurations.color,
    sentenceStructureRangeTypeToBracketsMap: {
      modifier: convertBracketNameToBrackets(
        configurations.sentenceStructureRangeTypeToBracketNameMap.modifier,
      ),
      phrase: convertBracketNameToBrackets(
        configurations.sentenceStructureRangeTypeToBracketNameMap.phrase,
      ),
      clause: convertBracketNameToBrackets(
        configurations.sentenceStructureRangeTypeToBracketNameMap.clause,
      ),
    },
    sentenceElementNameToSentenceElementSymbolMap:
      configurations.sentenceElementNameToSentenceElementSymbolMap,
    sentenceElementPosition: {
      determineSentenceElementRangeSentenceElementPosition: (rangePosition) =>
        determineSentenceElementPosition(
          configurations.sentenceElementPositionType
            .sentenceElementRangeSentenceElementPositionType,
          rangePosition,
        ),
      determineSentenceStructureRangeSentenceElementPosition: (rangePosition) =>
        determineSentenceElementPosition(
          configurations.sentenceElementPositionType
            .sentenceStructureRangeSentenceElementPositionType,
          rangePosition,
        ),
    },
    determineRelationSvgPathData: (fromRangePosition, toRangePosition) =>
      determineRelationSvgPathData(
        configurations.relationShapeType,
        fromRangePosition,
        toRangePosition,
      ),
    determineCoordinationSvgPathData: (coordinationPosition) =>
      determineCoordinationSvgPathData(
        configurations.layoutMode,
        coordinationPosition,
      ),
    layoutMode: configurations.layoutMode,
  };
}
