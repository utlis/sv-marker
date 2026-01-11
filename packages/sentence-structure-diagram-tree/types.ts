import type {
  Coordination,
  CoordinationChild,
  Range,
  Word,
} from "@sentence-structure-diagram-app/sentence-structure-data";

export type SentenceStructureDiagramWordNode = {
  word: Word;
  position: {
    start: number;
    end: number;
    top: number;
    bottom: number;
  };
};

export type SentenceStructureDiagramRangeNode = {
  range: Range;
  position: {
    end: number;
    top: number;
    bottom: number;
  };
  children: (
    | SentenceStructureDiagramWordNode
    | SentenceStructureDiagramRangeNode
    | SentenceStructureDiagramCoordinationNode
  )[];
};

export type SentenceStructureDiagramCoordinationChildNode = {
  coordinationChild: CoordinationChild;
  position: {
    end: number;
    top: number;
    bottom: number;
  };
  children: (
    | SentenceStructureDiagramWordNode
    | SentenceStructureDiagramRangeNode
    | SentenceStructureDiagramCoordinationNode
  )[];
};

export type SentenceStructureDiagramCoordinationNode = {
  coordination: Coordination;
  position: {
    end: number;
    top: number;
    bottom: number;
  };
  children: SentenceStructureDiagramCoordinationChildNode[];
};

export type SentenceStructureDiagramTree = {
  position: {
    start: number;
    end: number;
    top: number;
    bottom: number;
  };
  children: (
    | SentenceStructureDiagramWordNode
    | SentenceStructureDiagramRangeNode
    | SentenceStructureDiagramCoordinationNode
  )[];
};

export type SentenceStructureDiagramNode =
  | SentenceStructureDiagramWordNode
  | SentenceStructureDiagramRangeNode
  | SentenceStructureDiagramCoordinationChildNode
  | SentenceStructureDiagramCoordinationNode
  | SentenceStructureDiagramTree;
