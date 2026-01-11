import {
  type Coordination,
  type CoordinationChild,
  type Range,
  type Word,
} from "@sentence-structure-diagram-app/sentence-structure-data";

export type SentenceStructureWordNode = {
  type: "word";
  word: Word;
};

export type SentenceStructureRangeNode = {
  type: "range";
  range: Range;
  children: (
    | SentenceStructureWordNode
    | SentenceStructureRangeNode
    | SentenceStructureCoordinationNode
  )[];
};

export type SentenceStructureCoordinationChildNode = {
  type: "coordination-child";
  coordinationChild: CoordinationChild;
  children: (
    | SentenceStructureWordNode
    | SentenceStructureRangeNode
    | SentenceStructureCoordinationNode
  )[];
};

export type SentenceStructureCoordinationNode = {
  type: "coordination";
  coordination: Coordination;
  children: SentenceStructureCoordinationChildNode[];
};

export type SentenceStructureTree = {
  type: "tree";
  children: (
    | SentenceStructureWordNode
    | SentenceStructureRangeNode
    | SentenceStructureCoordinationNode
  )[];
};

export type SentenceStructureNode =
  | SentenceStructureWordNode
  | SentenceStructureRangeNode
  | SentenceStructureCoordinationChildNode
  | SentenceStructureCoordinationNode
  | SentenceStructureTree;
