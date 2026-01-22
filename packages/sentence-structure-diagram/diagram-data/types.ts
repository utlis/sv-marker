import type { HexRGBColor } from "@sentence-structure-diagram-app/sentence-structure-diagram-notation";

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
    id: string;
    text: string;
    rectangle: {
      x: number;
      y: number;
    };
    style: TextStyle;
  }[];
  underlines: {
    id: string;
    lineSegments: {
      x1: number;
      x2: number;
      y: number;
    }[];
    style: StrokeStyle;
  }[];
  brackets: {
    id: string;
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
    id: string;
    linePaths: {
      pathCommands: PathCommand[];
    }[];
    style: StrokeStyle;
  }[];
  highlights: {
    id: string;
    lineRectangles: {
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    style: BackgroundStyle;
  }[];
  sentenceElementLabels: {
    id: string;
    text: string;
    x: number;
    y: number;
    anchorX: "left" | "center";
    anchorY: "top" | "bottom";
    style: TextStyle;
  }[];
  sentenceConstituentLabels: {
    id: string;
    text: string;
    x: number;
    y: number;
    anchorX: "left" | "center";
    anchorY: "top" | "bottom";
    style: TextStyle;
  }[];
  arrows: {
    id: string;
    pathCommands: PathCommand[];
    style: StrokeStyle;
  }[];
  coordinationGroupIndicators: {
    id: string;
    linePaths: {
      pathCommands: PathCommand[];
    }[];
    style: StrokeStyle;
  }[];
};
