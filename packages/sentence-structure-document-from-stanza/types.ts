type StanzaTokenizedWord = {
  id: number;
  text: string;
};

type StanzaTokenizedToken = {
  text: string;
  words: StanzaTokenizedWord[];
  spaces_after: string;
  spaces_before: string;
};

type StanzaTokenizedSentence = {
  text: string;
  tokens: StanzaTokenizedToken[];
};

export type StanzaTokenizedDocument = {
  text: string;
  sentences: StanzaTokenizedSentence[];
};

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

export type StanzaParsedWord = {
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

type StanzaParsedToken = {
  text: string;
  words: StanzaParsedWord[];
  spaces_after: string;
  spaces_before: string;
};

export type StanzaConstituencyNode = {
  label:
    | (
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
        | "X"
      )
    | (
        | "$"
        | "''"
        | ","
        | "-LRB-"
        | "-RRB-"
        | "."
        | ":"
        | "ADD"
        | "AFX"
        | "CC"
        | "CD"
        | "DT"
        | "EX"
        | "FW"
        | "HYPH"
        | "IN"
        | "JJ"
        | "JJR"
        | "JJS"
        | "LS"
        | "MD"
        | "NFP"
        | "NN"
        | "NNP"
        | "NNPS"
        | "NNS"
        | "PDT"
        | "POS"
        | "PRP"
        | "PRP$"
        | "RB"
        | "RBR"
        | "RBS"
        | "RP"
        | "SYM"
        | "TO"
        | "UH"
        | "VB"
        | "VBD"
        | "VBG"
        | "VBN"
        | "VBP"
        | "VBZ"
        | "WDT"
        | "WP"
        | "WP$"
        | "WRB"
        | "``"
      )
    | string;
  children: StanzaConstituencyNode[];
};

export type StanzaParsedSentence = {
  text: string;
  tokens: StanzaParsedToken[];
  constituency: StanzaConstituencyNode;
};

export type StanzaParsedDocument = {
  text: string;
  sentences: StanzaParsedSentence[];
};
