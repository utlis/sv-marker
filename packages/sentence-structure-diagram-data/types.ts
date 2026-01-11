export type SentenceStructureDiagramData = {
  position: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  color: {
    primaryColor: string;
    textColor: string;
  };
  words: {
    index: number;
    text: string;
    openingBrackets: string[];
    closingBrackets: string[];
    position: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }[];
  underlines: {
    rangeId: string;
    position: {
      start: number;
      end: number;
      bottom: number;
    }[];
  }[];
  sentenceElements: {
    rangeId: string;
    symbol: string | null;
    position: {
      x: number;
      y: number;
    };
  }[];
  relations: {
    relationId: string;
    svgPathData: string;
  }[];
  coordinations: {
    coordinationId: string;
    svgPathData: string;
  }[];
};
