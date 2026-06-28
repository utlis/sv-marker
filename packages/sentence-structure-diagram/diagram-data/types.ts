import type { HexRGBColor } from "@sv-marker/sentence-structure-diagram-notation";

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
  strokeWidth: number;
};

type Point = { x: number; y: number };

export type PathCommand =
  | {
      type: "move-to";
      to: Point;
    }
  | {
      type: "line-to";
      to: Point;
    }
  | {
      type: "cubic-bezier-curve";
      startControlPoint: Point;
      endControlPoint: Point;
      to: Point;
    }
  | {
      type: "quadratic-bezier-curve";
      controlPoint: Point;
      to: Point;
    }
  | {
      type: "close-path";
    };

export type SentenceStructureDiagramData = {
  canvas: {
    width: number;
    height: number;
  };
  words: {
    sentenceId: string;
    wordId: string;
    text: string;
    rectangle: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    style: TextStyle;
  }[];
  underlines: {
    sentenceId: string;
    sentenceStructureElementId: string;
    lineSegments: {
      x1: number;
      x2: number;
      y: number;
    }[];
    style: StrokeStyle;
  }[];
  brackets: {
    sentenceId: string;
    sentenceStructureElementId: string;
    openingBracket: {
      text: string;
      x: number;
      y: number;
    };
    closingBracket: {
      text: string;
      x: number;
      y: number;
    };
    style: TextStyle;
  }[];
  boxes: {
    sentenceId: string;
    sentenceStructureElementId: string;
    linePaths: {
      pathCommands: PathCommand[];
    }[];
    style: StrokeStyle;
  }[];
  highlights: {
    sentenceId: string;
    sentenceStructureElementId: string;
    lineRectangles: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    style: BackgroundStyle;
  }[];
  sentenceElementLabels: {
    sentenceId: string;
    sentenceStructureElementId: string;
    text: string;
    x: number;
    y: number;
    anchorX: "left" | "center";
    anchorY: "top" | "bottom";
    style: TextStyle;
  }[];
  sentenceConstituentLabels: {
    sentenceId: string;
    sentenceStructureElementId: string;
    text: string;
    x: number;
    y: number;
    anchorX: "left" | "center";
    anchorY: "top" | "bottom";
    style: TextStyle;
  }[];
  arrows: {
    sentenceId: string;
    modificationId: string;
    pathCommands: PathCommand[];
    style: StrokeStyle;
  }[];
  coordinationGroupIndicators: {
    sentenceId: string;
    coordinationId: string;
    linePaths: {
      pathCommands: PathCommand[];
    }[];
    style: StrokeStyle;
  }[];
};
