export type StanzaDependencyLabel =
  | "acl"
  | "acl:relcl"
  | "advcl"
  | "advcl:relcl"
  | "advmod"
  | "amod"
  | "appos"
  | "aux"
  | "aux:pass"
  | "case"
  | "cc"
  | "cc:preconj"
  | "ccomp"
  | "compound"
  | "compound:prt"
  | "conj"
  | "cop"
  | "csubj"
  | "csubj:outer"
  | "csubj:pass"
  | "dep"
  | "det"
  | "det:predet"
  | "discourse"
  | "dislocated"
  | "expl"
  | "fixed"
  | "flat"
  | "goeswith"
  | "iobj"
  | "list"
  | "mark"
  | "nmod"
  | "nmod:desc"
  | "nmod:poss"
  | "nmod:unmarked"
  | "nsubj"
  | "nsubj:outer"
  | "nsubj:pass"
  | "nummod"
  | "obj"
  | "obl"
  | "obl:agent"
  | "obl:npmod"
  | "obl:tmod"
  | "obl:unmarked"
  | "orphan"
  | "parataxis"
  | "punct"
  | "reparandum"
  | "root"
  | "vocative"
  | "xcomp";

export type StanzaWord = {
  id: number;
  text: string;
  lemma: string;
  upos:
    | "ADJ"
    | "ADP"
    | "ADV"
    | "AUX"
    | "CCONJ"
    | "DET"
    | "INTJ"
    | "NOUN"
    | "NUM"
    | "PART"
    | "PRON"
    | "PROPN"
    | "PUNCT"
    | "SCONJ"
    | "SYM"
    | "VERB"
    | "X";
  xpos: string;
  feats: string | null;
  head: number;
  deprel: StanzaDependencyLabel;
};

type StanzaToken = {
  text: string;
  words: StanzaWord[];
  spaces_after: string;
  spaces_before: string;
};

export type StanzaParseTree = {
  label:
    | string
    | "ADJP"
    | "ADVP"
    | "CONJP"
    | "FRAG"
    | "INTJ"
    | "LST"
    | "NAC"
    | "NML"
    | "NP"
    | "PP"
    | "PRN"
    | "PRT"
    | "QP"
    | "ROOT"
    | "RRC"
    | "S"
    | "SBAR"
    | "SBARQ"
    | "SINV"
    | "SQ"
    | "UCP"
    | "VP"
    | "WHADJP"
    | "WHADVP"
    | "WHNP"
    | "WHPP"
    | "X";
  children: StanzaParseTree[];
};

export type StanzaSentence = {
  text: string;
  tokens: StanzaToken[];
  constituency: StanzaParseTree;
};

export type StanzaDocument = { text: string; sentences: StanzaSentence[] };
