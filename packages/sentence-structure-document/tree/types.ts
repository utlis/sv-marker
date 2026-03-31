import type {
  Coordination,
  CoordinationPart,
  Modification,
  SentenceStructureElement,
  Word,
} from "../schema.js";

export type SentenceStructureDocumentWordNode = {
  type: "word";
  word: Word;
};

export type SentenceStructureDocumentSentenceStructureElementNode = {
  type: "sentence-structure-element";
  sentenceStructureElement: SentenceStructureElement;
  children: (
    | SentenceStructureDocumentWordNode
    | SentenceStructureDocumentSentenceStructureElementNode
    | SentenceStructureDocumentCoordinationNode
  )[];
};

export type SentenceStructureDocumentCoordinationPartNode = {
  type: "coordination-part";
  coordinationPart: CoordinationPart;
  children: (
    | SentenceStructureDocumentWordNode
    | SentenceStructureDocumentSentenceStructureElementNode
    | SentenceStructureDocumentCoordinationNode
  )[];
};

export type SentenceStructureDocumentCoordinationNode = {
  type: "coordination";
  coordination: Coordination;
  children: SentenceStructureDocumentCoordinationPartNode[];
};

export type SentenceStructureDocumentRootNode = {
  type: "root";
  children: (
    | SentenceStructureDocumentWordNode
    | SentenceStructureDocumentSentenceStructureElementNode
    | SentenceStructureDocumentCoordinationNode
  )[];
};

export type SentenceStructureDocumentSentenceTree = {
  sentenceId: string;
  sentenceIndex: number;
  root: SentenceStructureDocumentRootNode;
  modifications: Modification[];
};

export type SentenceStructureDocumentForest = {
  sentences: SentenceStructureDocumentSentenceTree[];
};

export type SentenceStructureDocumentNode =
  | SentenceStructureDocumentWordNode
  | SentenceStructureDocumentSentenceStructureElementNode
  | SentenceStructureDocumentCoordinationPartNode
  | SentenceStructureDocumentCoordinationNode
  | SentenceStructureDocumentRootNode;
