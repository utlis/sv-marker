import * as z from "zod";

export const CanvasSchema = z.object({
  width: z.number(),
});

export const HexRGBColorSchema = z.templateLiteral(["#", z.hex().length(6)]);
export type HexRGBColor = z.infer<typeof HexRGBColorSchema>;

export const ThemeSchema = z.object({
  colors: z.object({
    primary: HexRGBColorSchema,
    text: HexRGBColorSchema,
    background: HexRGBColorSchema,
  }),
  typography: z.object({
    fontSize: z.number(),
  }),
  spacing: z.object({
    padding: z.number(),
    wordSpacing: z.number(),
    lineSpacing: z.number(),
    continuationIndent: z.number(),
  }),
});

export const lineStyleOptions = ["solid", "dashed"] as const;

export const colorOptions = ["primary", "text", "background"] as const;

export const bracketTypeOptions = [
  "parenthesis",
  "angle-bracket",
  "curly-bracket",
  "square-bracket",
] as const;

export const RangeMarkerSchema = z.union([
  z.object({
    type: z.literal("underline"),
    lineStyle: z.literal(lineStyleOptions),
    color: z.literal(colorOptions),
  }),
  z.object({
    type: z.literal("bracket"),
    bracketType: z.literal(bracketTypeOptions),
    color: z.literal(colorOptions),
  }),
  z.object({
    type: z.literal("box"),
    color: z.literal(colorOptions),
  }),
  z.object({
    type: z.literal("text-emphasis"),
    color: z.literal(colorOptions),
  }),
  z.object({
    type: z.literal("highlight"),
    color: z.literal(colorOptions),
  }),
  z.object({
    type: z.literal("bold"),
  }),
  z.object({
    type: z.literal("none"),
  }),
]);

export const labelPlacementOptions = [
  "below-center",
  "below-left",
  "above-center",
  "above-left",
] as const;

export const SentenceStructureElementNotationSchema = z.object({
  rangeMarking: z.object({
    coreSentenceElement: RangeMarkerSchema,
    sentenceConstituent: z.object({
      phrase: z.object({
        nominal: RangeMarkerSchema,
        adjectival: RangeMarkerSchema,
        adverbial: RangeMarkerSchema,
      }),
      clause: z.object({
        nominal: RangeMarkerSchema,
        adjectival: RangeMarkerSchema,
        adverbial: RangeMarkerSchema,
      }),
      adverbialPhrase: RangeMarkerSchema,
    }),
    modificationElement: RangeMarkerSchema,
  }),
  sentenceElementLabeling: z.object({
    labels: z.object({
      S: z.string(),
      V: z.string(),
      O: z.string(),
      C: z.string(),
      M: z.string(),
    }),
    placement: z.object({
      coreSentenceElement: z.literal(labelPlacementOptions),
      sentenceConstituent: z.object({
        phrase: z.object({
          nominal: z.literal(labelPlacementOptions),
          adjectival: z.literal(labelPlacementOptions),
          adverbial: z.literal(labelPlacementOptions),
        }),
        clause: z.object({
          nominal: z.literal(labelPlacementOptions),
          adjectival: z.literal(labelPlacementOptions),
          adverbial: z.literal(labelPlacementOptions),
        }),
        adverbialPhrase: z.literal(labelPlacementOptions),
      }),
    }),
    color: z.literal(colorOptions),
    labelSuffixes: z.object({
      showNestingDepthPrimes: z.boolean(),
      showConjunctNumbering: z.boolean(),
    }),
  }),
  sentenceConstituentLabeling: z.object({
    labels: z.object({
      phrase: z.object({
        nominal: z.string(),
        adjectival: z.string(),
        adverbial: z.string(),
      }),
      clause: z.object({
        nominal: z.string(),
        adjectival: z.string(),
        adverbial: z.string(),
      }),
      adverbialPhrase: z.string(),
    }),
    placement: z.object({
      phrase: z.object({
        nominal: z.literal(labelPlacementOptions),
        adjectival: z.literal(labelPlacementOptions),
        adverbial: z.literal(labelPlacementOptions),
      }),
      clause: z.object({
        nominal: z.literal(labelPlacementOptions),
        adjectival: z.literal(labelPlacementOptions),
        adverbial: z.literal(labelPlacementOptions),
      }),
      adverbialPhrase: z.literal(labelPlacementOptions),
    }),
    color: z.literal(colorOptions),
  }),
});

export const ModificationNotationSchema = z.object({
  arrow: z.object({
    type: z.literal(["curved", "orthogonal"]),
    color: z.literal(colorOptions),
  }),
});

export const SentenceStructureDiagramNotationSchema = z.union([
  z.object({
    canvas: CanvasSchema,
    theme: ThemeSchema,
    enableReflow: z.literal(false),
    sentenceStructureElementNotation: SentenceStructureElementNotationSchema,
    modificationNotation: ModificationNotationSchema,
    coordinationNotation: z.object({
      layout: z.object({
        direction: z.literal("horizontal"),
      }),
      rangeMarking: z.object({
        coordinator: RangeMarkerSchema,
        correlative: RangeMarkerSchema,
        conjunct: RangeMarkerSchema,
      }),
      groupIndicator: z.union([
        z.object({
          type: z.literal("bus-connector"),
          color: z.literal(colorOptions),
        }),
        z.object({
          type: z.literal("none"),
        }),
      ]),
    }),
  }),
  z.object({
    canvas: CanvasSchema,
    theme: ThemeSchema,
    enableReflow: z.literal(true),
    sentenceStructureElementNotation: SentenceStructureElementNotationSchema,
    modificationNotation: ModificationNotationSchema,
    coordinationNotation: z.object({
      layout: z.object({
        direction: z.literal("vertical"),
      }),
      rangeMarking: z.object({
        coordinator: RangeMarkerSchema,
        correlative: RangeMarkerSchema,
        conjunct: RangeMarkerSchema,
      }),
      groupIndicator: z.union([
        z.object({
          type: z.literal("bracket"),
          bracketType: z.literal(bracketTypeOptions),
          placement: z.literal(["left", "both-sides"]),
          color: z.literal(colorOptions),
        }),
        z.object({
          type: z.literal("bus-connector"),
          color: z.literal(colorOptions),
        }),
        z.object({
          type: z.literal("none"),
        }),
      ]),
    }),
    layoutStrategy: z.union([
      z.object({
        lineBreakStrategy: z.literal("greedy-word-wrap"),
      }),
      z.object({
        lineBreakStrategy: z.literal("largest-boundary-first"),
        continuationLineStart: z.literal(["content-start", "scope-start"]),
      }),
    ]),
  }),
]);
export type SentenceStructureDiagramNotation = z.infer<
  typeof SentenceStructureDiagramNotationSchema
>;
