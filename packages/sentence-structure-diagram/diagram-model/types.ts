import type { HexRGBColor } from "@sv-marker/sentence-structure-diagram-notation";

export type TextStyle = {
  fontSize: number;
  fontWeight: "normal" | "bold";
  textColor: HexRGBColor;
};

export type BackgroundStyle = {
  backgroundColor: HexRGBColor;
};

export type StrokeStyle = {
  strokeStyle: "solid" | "dashed";
  strokeColor: HexRGBColor;
};

type RangeMarker =
  | {
      type: "underline";
      style: StrokeStyle;
    }
  | {
      type: "bracket";
      openingBracket: string;
      closingBracket: string;
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

export type SentenceStructureDiagramModelWordNode = {
  type: "word";
  id: string;
  text: string;
  whitespaceAfter: string;
  style: TextStyle;
};

export type SentenceStructureDiagramModelSentenceStructureElementNode = {
  type: "sentence-structure-element";
  id: string;
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
    | SentenceStructureDiagramModelWordNode
    | SentenceStructureDiagramModelSentenceStructureElementNode
    | SentenceStructureDiagramModelCoordinationNode
  )[];
};

export type SentenceStructureDiagramModelCoordinationPartNode = {
  type: "coordination-part";
  id: string;
  rangeMarker: RangeMarker;
  children: (
    | SentenceStructureDiagramModelWordNode
    | SentenceStructureDiagramModelSentenceStructureElementNode
    | SentenceStructureDiagramModelCoordinationNode
  )[];
};

export type SentenceStructureDiagramModelCoordinationNode = {
  type: "coordination";
  id: string;
  children: SentenceStructureDiagramModelCoordinationPartNode[];
};

export type SentenceStructureDiagramModelRootNode = {
  type: "root";
  children: (
    | SentenceStructureDiagramModelWordNode
    | SentenceStructureDiagramModelSentenceStructureElementNode
    | SentenceStructureDiagramModelCoordinationNode
  )[];
};

export type SentenceStructureDiagramModelModification = {
  id: string;
  modifierSentenceStructureElementNodeId: string;
  modifiedSentenceStructureElementNodeId: string;
  arrow: {
    type: "curved" | "orthogonal";
    style: StrokeStyle;
  };
};

export type SentenceStructureDiagramModelSentenceTree = {
  id: string;
  root: SentenceStructureDiagramModelRootNode;
  modifications: SentenceStructureDiagramModelModification[];
};

export type SentenceStructureDiagramModelForest = {
  layoutSettings:
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
            style: StrokeStyle;
          } | null;
        };
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
                style: StrokeStyle;
              }
            | {
                type: "bus-connector";
                style: StrokeStyle;
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
      };
  sentences: SentenceStructureDiagramModelSentenceTree[];
};

export type SentenceStructureDiagramModelNode =
  | SentenceStructureDiagramModelWordNode
  | SentenceStructureDiagramModelSentenceStructureElementNode
  | SentenceStructureDiagramModelCoordinationPartNode
  | SentenceStructureDiagramModelCoordinationNode
  | SentenceStructureDiagramModelRootNode;
