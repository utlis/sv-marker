import type { SentenceStructureDiagramNotation } from "../schema.js";

export const reflowDiagramPreset: SentenceStructureDiagramNotation = {
  canvas: {
    width: 1200,
  },
  theme: {
    colors: {
      primary: "#1976d2",
      text: "#000000",
      background: "#e0e0e0",
    },
    typography: {
      fontSize: 16,
    },
    spacing: {
      padding: 48,
      wordSpacing: 16,
      lineSpacing: 32,
      continuationIndent: 32,
    },
  },
  enableReflow: true,
  sentenceStructureElementNotation: {
    rangeMarking: {
      coreSentenceElement: {
        type: "underline",
        lineStyle: "solid",
        color: "primary",
      },
      sentenceConstituent: {
        verbalPhrase: {
          nominal: {
            type: "bracket",
            bracketType: "angle-bracket",
            color: "primary",
          },
          adjectival: {
            type: "bracket",
            bracketType: "angle-bracket",
            color: "primary",
          },
          adverbial: {
            type: "bracket",
            bracketType: "angle-bracket",
            color: "primary",
          },
        },
        clause: {
          nominal: {
            type: "bracket",
            bracketType: "square-bracket",
            color: "primary",
          },
          adjectival: {
            type: "bracket",
            bracketType: "square-bracket",
            color: "primary",
          },
          adverbial: {
            type: "bracket",
            bracketType: "square-bracket",
            color: "primary",
          },
        },
        modifierPhrase: {
          type: "bracket",
          bracketType: "parenthesis",
          color: "primary",
        },
      },
      modificationElement: {
        type: "underline",
        lineStyle: "solid",
        color: "primary",
      },
    },
    sentenceElementLabeling: {
      labels: {
        S: "S",
        V: "V",
        O: "O",
        C: "C",
        M: "M",
      },
      placement: {
        coreSentenceElement: "below-center",
        sentenceConstituent: {
          verbalPhrase: {
            nominal: "below-left",
            adjectival: "below-left",
            adverbial: "below-left",
          },
          clause: {
            nominal: "below-left",
            adjectival: "below-left",
            adverbial: "below-left",
          },
          modifierPhrase: "below-left",
        },
      },
      color: "primary",
      labelSuffixes: {
        showNestingDepthPrimes: true,
        showConjunctNumbering: true,
      },
    },
    sentenceConstituentLabeling: {
      labels: {
        verbalPhrase: {
          nominal: "",
          adjectival: "",
          adverbial: "",
        },
        clause: {
          nominal: "",
          adjectival: "",
          adverbial: "",
        },
        modifierPhrase: "",
      },
      placement: {
        verbalPhrase: {
          nominal: "above-left",
          adjectival: "above-left",
          adverbial: "above-left",
        },
        clause: {
          nominal: "above-left",
          adjectival: "above-left",
          adverbial: "above-left",
        },
        modifierPhrase: "above-left",
      },
      color: "text",
    },
  },
  modificationNotation: {
    arrow: {
      type: "curved",
      color: "primary",
    },
  },
  coordinationNotation: {
    layout: {
      direction: "vertical",
    },
    rangeMarking: {
      coordinator: {
        type: "text-emphasis",
        color: "primary",
      },
      correlative: {
        type: "box",
        color: "text",
      },
      conjunct: {
        type: "none",
      },
    },
    groupIndicator: {
      type: "bracket",
      placement: "left",
      bracketType: "square-bracket",
      color: "primary",
    },
  },
  layoutStrategy: {
    lineBreakStrategy: "largest-boundary-first",
    continuationLineStart: "scope-start",
  },
};
