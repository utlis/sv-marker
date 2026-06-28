import type {
  Coordination,
  CoordinationPart,
  Modification,
  SentenceStructureElement,
  Word,
} from "../../schema.js";

export type SentenceStructureDecoratedDocumentWordNode = {
  type: "word";
  word: Word;
};

export type SentenceStructureDecoratedDocumentSentenceStructureElementNode = {
  type: "sentence-structure-element";
  sentenceStructureElement: SentenceStructureElement;
  nestingDepth: number;
  conjunctOrdinalPath: number[];
  children: (
    | SentenceStructureDecoratedDocumentWordNode
    | SentenceStructureDecoratedDocumentSentenceStructureElementNode
    | SentenceStructureDecoratedDocumentCoordinationNode
  )[];
};

export type SentenceStructureDecoratedDocumentCoordinationPartNode = {
  type: "coordination-part";
  coordinationPart: CoordinationPart;
  coordinationId: string;
  children: (
    | SentenceStructureDecoratedDocumentWordNode
    | SentenceStructureDecoratedDocumentSentenceStructureElementNode
    | SentenceStructureDecoratedDocumentCoordinationNode
  )[];
};

export type SentenceStructureDecoratedDocumentCoordinationNode = {
  type: "coordination";
  coordination: Coordination;
  children: SentenceStructureDecoratedDocumentCoordinationPartNode[];
};

export type SentenceStructureDecoratedDocumentRootNode = {
  type: "root";
  children: (
    | SentenceStructureDecoratedDocumentWordNode
    | SentenceStructureDecoratedDocumentSentenceStructureElementNode
    | SentenceStructureDecoratedDocumentCoordinationNode
  )[];
};

export type SentenceStructureDecoratedDocumentSentenceTree = {
  sentenceId: string;
  sentenceIndex: number;
  root: SentenceStructureDecoratedDocumentRootNode;
  modifications: Modification[];
};

export type SentenceStructureDecoratedDocumentForest = {
  sentences: SentenceStructureDecoratedDocumentSentenceTree[];
};

export type SentenceStructureDecoratedDocumentNode =
  | SentenceStructureDecoratedDocumentWordNode
  | SentenceStructureDecoratedDocumentSentenceStructureElementNode
  | SentenceStructureDecoratedDocumentCoordinationPartNode
  | SentenceStructureDecoratedDocumentCoordinationNode
  | SentenceStructureDecoratedDocumentRootNode;
