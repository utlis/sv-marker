import type { SentenceStructureDiagramNotation } from "../schema.js";

export const originalLayoutAnnotationPreset: SentenceStructureDiagramNotation =
  {
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
        wordSpacing: 32,
        lineSpacing: 48,
        continuationIndent: 32,
      },
    },
    enableReflow: false,
    sentenceStructureElementNotation: {
      rangeMarking: {
        coreSentenceElement: {
          type: "underline",
          lineStyle: "solid",
          color: "primary",
        },
        sentenceConstituent: {
          phrase: {
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
          adverbialPhrase: {
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
            phrase: {
              nominal: "below-left",
              adjectival: "below-left",
              adverbial: "below-left",
            },
            clause: {
              nominal: "below-left",
              adjectival: "below-left",
              adverbial: "below-left",
            },
            adverbialPhrase: "below-left",
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
          phrase: {
            nominal: "名詞句",
            adjectival: "形容詞句",
            adverbial: "副詞句",
          },
          clause: {
            nominal: "名詞節",
            adjectival: "形容詞節",
            adverbial: "副詞節",
          },
          adverbialPhrase: "",
        },
        placement: {
          phrase: {
            nominal: "above-left",
            adjectival: "above-left",
            adverbial: "above-left",
          },
          clause: {
            nominal: "above-left",
            adjectival: "above-left",
            adverbial: "above-left",
          },
          adverbialPhrase: "above-left",
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
        direction: "horizontal",
      },
      rangeMarking: {
        coordinator: {
          type: "box",
          color: "text",
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
        type: "bus-connector",
        color: "primary",
      },
    },
  };
