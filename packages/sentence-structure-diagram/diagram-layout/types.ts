import type { HexRGBColor } from "@sentence-structure-diagram-app/sentence-structure-diagram-notation";

export type Rectangle = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

type TextStyle = {
  fontSize: number;
  fontWeight: "normal" | "bold";
  textColor: HexRGBColor;
};

type BackgroundStyle = {
  backgroundColor: HexRGBColor;
};

type StrokeStyle = {
  strokeStyle: "solid" | "dashed";
  strokeColor: HexRGBColor;
};

export type RangeMarker =
  | {
      type: "underline";
      style: StrokeStyle;
    }
  | {
      type: "bracket";
      openingBracket: {
        text: string;
        left: number;
        top: number;
      };
      closingBracket: {
        text: string;
        left: number;
        top: number;
      };
      style: TextStyle;
    }
  | {
      type: "box";
      style: StrokeStyle;
    }
  | {
      type: "highlight";
      style: BackgroundStyle;
    }
  | null;

export type SentenceStructureDiagramLayoutWordNode = {
  type: "word";
  id: string;
  text: string;
  whitespaceAfter: string;
  rectangle: Rectangle;
  style: TextStyle;
};

export type SentenceStructureDiagramLayoutSentenceStructureElementNode = {
  type: "sentence-structure-element";
  id: string;
  rectangles: Rectangle[];
  rangeMarker: RangeMarker;
  sentenceElementLabel: {
    text: string;
    placement: "below-center" | "below-left" | "above-center" | "above-left";
    style: TextStyle;
  } | null;
  sentenceConstituentLabel: {
    text: string;
    placement: "below-center" | "below-left" | "above-center" | "above-left";
    style: TextStyle;
  } | null;
  children: (
    | SentenceStructureDiagramLayoutWordNode
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationNode
  )[];
};

export type SentenceStructureDiagramLayoutCoordinationPartNode = {
  type: "coordination-part";
  id: string;
  rectangles: Rectangle[];
  rangeMarker: RangeMarker;
  children: (
    | SentenceStructureDiagramLayoutWordNode
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationNode
  )[];
};

export type SentenceStructureDiagramLayoutCoordinationNode = {
  type: "coordination";
  id: string;
  rectangles: Rectangle[];
  children: SentenceStructureDiagramLayoutCoordinationPartNode[];
};

export type SentenceStructureDiagramLayoutRootNode = {
  type: "root";
  rectangles: Rectangle[];
  children: (
    | SentenceStructureDiagramLayoutWordNode
    | SentenceStructureDiagramLayoutSentenceStructureElementNode
    | SentenceStructureDiagramLayoutCoordinationNode
  )[];
};

export type SentenceStructureDiagramLayoutModification = {
  id: string;
  modifierSentenceStructureElementNodeId: string;
  modifiedSentenceStructureElementNodeId: string;
  arrow: {
    type: "curved" | "orthogonal";
    style: StrokeStyle;
  };
};

export type SentenceStructureDiagramLayoutSentenceTree = {
  id: string;
  root: SentenceStructureDiagramLayoutRootNode;
  modifications: SentenceStructureDiagramLayoutModification[];
};

export type SentenceStructureDiagramLayoutTree = {
  canvas: { width: number; height: number };
  layoutSettings:
    | {
        coordination: {
          layoutDirection: "horizontal";
          groupIndicator: {
            type: "bus-connector";
            style: StrokeStyle;
          } | null;
        };
      }
    | {
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
                style: StrokeStyle;
              }
            | {
                type: "bus-connector";
                style: StrokeStyle;
              }
            | null;
        };
      };
  sentences: SentenceStructureDiagramLayoutSentenceTree[];
};

export type SentenceStructureDiagramLayoutNode =
  | SentenceStructureDiagramLayoutWordNode
  | SentenceStructureDiagramLayoutSentenceStructureElementNode
  | SentenceStructureDiagramLayoutCoordinationPartNode
  | SentenceStructureDiagramLayoutCoordinationNode
  | SentenceStructureDiagramLayoutRootNode;
