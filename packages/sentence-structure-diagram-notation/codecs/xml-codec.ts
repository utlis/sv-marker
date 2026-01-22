import * as z from "zod";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  bracketTypeOptions,
  CanvasSchema,
  colorOptions,
  HexRGBColorSchema,
  labelPlacementOptions,
  lineStyleOptions,
  ModificationNotationSchema,
  RangeMarkerSchema,
  SentenceStructureDiagramNotationSchema,
  SentenceStructureElementNotationSchema,
  ThemeSchema,
  type SentenceStructureDiagramNotation,
} from "../schema.js";

const XMLCanvasSchema = z.object({
  "@_width": z.number(),
});

const xmlCanvasToCanvas = z.codec(XMLCanvasSchema, CanvasSchema, {
  decode: (xmlCanvas) => {
    return {
      width: xmlCanvas["@_width"],
    };
  },
  encode: (canvas) => {
    return {
      "@_width": canvas.width,
    };
  },
});

const XMLThemeSchema = z.object({
  colors: z.object({
    "@_primary": HexRGBColorSchema,
    "@_text": HexRGBColorSchema,
    "@_background": HexRGBColorSchema,
  }),
  typography: z.object({
    "@_font-size": z.string(),
  }),
  spacing: z.object({
    "@_padding": z.string(),
    "@_word-spacing": z.string(),
    "@_line-spacing": z.string(),
    "@_continuation-indent": z.string(),
  }),
});

const xmlThemeToTheme = z.codec(XMLThemeSchema, ThemeSchema, {
  decode: (xmlTheme) => {
    return {
      colors: {
        primary: xmlTheme.colors["@_primary"],
        text: xmlTheme.colors["@_text"],
        background: xmlTheme.colors["@_background"],
      },
      typography: {
        fontSize: Number(xmlTheme.typography["@_font-size"]),
      },
      spacing: {
        padding: Number(xmlTheme.spacing["@_padding"]),
        wordSpacing: Number(xmlTheme.spacing["@_word-spacing"]),
        lineSpacing: Number(xmlTheme.spacing["@_line-spacing"]),
        continuationIndent: Number(xmlTheme.spacing["@_continuation-indent"]),
      },
    };
  },
  encode: (theme) => {
    return {
      colors: {
        "@_primary": theme.colors.primary,
        "@_text": theme.colors.text,
        "@_background": theme.colors.background,
      },
      typography: {
        "@_font-size": String(theme.typography.fontSize),
      },
      spacing: {
        "@_padding": String(theme.spacing.padding),
        "@_word-spacing": String(theme.spacing.wordSpacing),
        "@_line-spacing": String(theme.spacing.lineSpacing),
        "@_continuation-indent": String(theme.spacing.continuationIndent),
      },
    };
  },
});

const XMLRangeMarkerSchema = z.optional(
  z.union([
    z.object({
      underline: z.object({
        "@_line-style": z.literal(lineStyleOptions),
        "@_color": z.literal(colorOptions),
      }),
    }),
    z.object({
      bracket: z.object({
        "@_type": z.literal(bracketTypeOptions),
        "@_color": z.literal(colorOptions),
      }),
    }),
    z.object({
      box: z.object({
        "@_color": z.literal(colorOptions),
      }),
    }),
    z.object({
      "text-emphasis": z.object({
        "@_color": z.literal(colorOptions),
      }),
    }),
    z.object({
      highlight: z.object({
        "@_color": z.literal(colorOptions),
      }),
    }),
    z.object({
      bold: z.literal(""),
    }),
  ]),
);

const xmlRangeMarkerToRangeMarker = z.codec(
  XMLRangeMarkerSchema,
  RangeMarkerSchema,
  {
    decode: (xmlRangeMarker) => {
      if (!xmlRangeMarker) {
        return { type: "none" } satisfies z.infer<typeof RangeMarkerSchema>;
      }

      if ("underline" in xmlRangeMarker) {
        return {
          type: "underline",
          lineStyle: xmlRangeMarker.underline["@_line-style"],
          color: xmlRangeMarker.underline["@_color"],
        } satisfies z.infer<typeof RangeMarkerSchema>;
      } else if ("bracket" in xmlRangeMarker) {
        return {
          type: "bracket",
          bracketType: xmlRangeMarker.bracket["@_type"],
          color: xmlRangeMarker.bracket["@_color"],
        } satisfies z.infer<typeof RangeMarkerSchema>;
      } else if ("box" in xmlRangeMarker) {
        return {
          type: "box",
          color: xmlRangeMarker.box["@_color"],
        } satisfies z.infer<typeof RangeMarkerSchema>;
      } else if ("text-emphasis" in xmlRangeMarker) {
        return {
          type: "text-emphasis",
          color: xmlRangeMarker["text-emphasis"]["@_color"],
        } satisfies z.infer<typeof RangeMarkerSchema>;
      } else if ("highlight" in xmlRangeMarker) {
        return {
          type: "highlight",
          color: xmlRangeMarker["highlight"]["@_color"],
        } satisfies z.infer<typeof RangeMarkerSchema>;
      } else {
        return {
          type: "bold",
        } satisfies z.infer<typeof RangeMarkerSchema>;
      }
    },
    encode: (rangeMarker) => {
      switch (rangeMarker.type) {
        case "underline":
          return {
            underline: {
              "@_line-style": rangeMarker.lineStyle,
              "@_color": rangeMarker.color,
            },
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "bracket":
          return {
            bracket: {
              "@_type": rangeMarker.bracketType,
              "@_color": rangeMarker.color,
            },
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "box":
          return {
            box: {
              "@_color": rangeMarker.color,
            },
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "text-emphasis":
          return {
            "text-emphasis": {
              "@_color": rangeMarker.color,
            },
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "highlight":
          return {
            highlight: {
              "@_color": rangeMarker.color,
            },
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "bold":
          return {
            bold: "",
          } satisfies z.infer<typeof XMLRangeMarkerSchema>;
        case "none":
          return undefined;
        default:
          rangeMarker satisfies never;
          throw new Error("Unreachable");
      }
    },
  },
);

const XMLSentenceStructureElementNotationSchema = z.object({
  "range-marking": z.object({
    "core-sentence-element": XMLRangeMarkerSchema,
    "sentence-constituent": z.object({
      phrase: z.object({
        nominal: XMLRangeMarkerSchema,
        adjectival: XMLRangeMarkerSchema,
        adverbial: XMLRangeMarkerSchema,
      }),
      clause: z.object({
        nominal: XMLRangeMarkerSchema,
        adjectival: XMLRangeMarkerSchema,
        adverbial: XMLRangeMarkerSchema,
      }),
      "adverbial-phrase": XMLRangeMarkerSchema,
    }),
    "modification-element": XMLRangeMarkerSchema,
  }),
  "sentence-element-labeling": z.object({
    labels: z.object({
      "@_S": z.string(),
      "@_V": z.string(),
      "@_O": z.string(),
      "@_C": z.string(),
      "@_M": z.string(),
    }),
    placement: z.object({
      "core-sentence-element": z.literal(labelPlacementOptions),
      "sentence-constituent": z.object({
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
        "adverbial-phrase": z.literal(labelPlacementOptions),
      }),
    }),
    "@_color": z.literal(colorOptions),
    "label-suffixes": z.object({
      "@_show-nesting-depth-primes": z.boolean(),
      "@_show-conjunct-numbering": z.boolean(),
    }),
  }),
  "sentence-constituent-labeling": z.object({
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
      "adverbial-phrase": z.string(),
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
      "adverbial-phrase": z.literal(labelPlacementOptions),
    }),
    "@_color": z.literal(colorOptions),
  }),
});

const xmlSentenceStructureElementNotationToSentenceStructureElementNotation =
  z.codec(
    XMLSentenceStructureElementNotationSchema,
    SentenceStructureElementNotationSchema,
    {
      decode: (xmlSentenceStructureElementNotation) => ({
        rangeMarking: {
          coreSentenceElement: xmlRangeMarkerToRangeMarker.decode(
            xmlSentenceStructureElementNotation["range-marking"][
              "core-sentence-element"
            ],
          ),
          sentenceConstituent: {
            phrase: {
              nominal: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].phrase.nominal,
              ),
              adjectival: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].phrase.adjectival,
              ),
              adverbial: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].phrase.adverbial,
              ),
            },
            clause: {
              nominal: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].clause.nominal,
              ),
              adjectival: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].clause.adjectival,
              ),
              adverbial: xmlRangeMarkerToRangeMarker.decode(
                xmlSentenceStructureElementNotation["range-marking"][
                  "sentence-constituent"
                ].clause.adverbial,
              ),
            },
            adverbialPhrase: xmlRangeMarkerToRangeMarker.decode(
              xmlSentenceStructureElementNotation["range-marking"][
                "sentence-constituent"
              ]["adverbial-phrase"],
            ),
          },
          modificationElement: xmlRangeMarkerToRangeMarker.decode(
            xmlSentenceStructureElementNotation["range-marking"][
              "modification-element"
            ],
          ),
        },
        sentenceElementLabeling: {
          labels: {
            S: xmlSentenceStructureElementNotation["sentence-element-labeling"]
              .labels["@_S"],
            V: xmlSentenceStructureElementNotation["sentence-element-labeling"]
              .labels["@_V"],
            O: xmlSentenceStructureElementNotation["sentence-element-labeling"]
              .labels["@_O"],
            C: xmlSentenceStructureElementNotation["sentence-element-labeling"]
              .labels["@_C"],
            M: xmlSentenceStructureElementNotation["sentence-element-labeling"]
              .labels["@_M"],
          },
          placement: {
            coreSentenceElement:
              xmlSentenceStructureElementNotation["sentence-element-labeling"]
                .placement["core-sentence-element"],
            sentenceConstituent: {
              phrase: {
                nominal:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].phrase.nominal,
                adjectival:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].phrase.adjectival,
                adverbial:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].phrase.adverbial,
              },
              clause: {
                nominal:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].clause.nominal,
                adjectival:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].clause.adjectival,
                adverbial:
                  xmlSentenceStructureElementNotation[
                    "sentence-element-labeling"
                  ].placement["sentence-constituent"].clause.adverbial,
              },
              adverbialPhrase:
                xmlSentenceStructureElementNotation["sentence-element-labeling"]
                  .placement["sentence-constituent"]["adverbial-phrase"],
            },
          },
          color:
            xmlSentenceStructureElementNotation["sentence-element-labeling"][
              "@_color"
            ],
          labelSuffixes: {
            showNestingDepthPrimes:
              xmlSentenceStructureElementNotation["sentence-element-labeling"][
                "label-suffixes"
              ]["@_show-nesting-depth-primes"],
            showConjunctNumbering:
              xmlSentenceStructureElementNotation["sentence-element-labeling"][
                "label-suffixes"
              ]["@_show-conjunct-numbering"],
          },
        },
        sentenceConstituentLabeling: {
          labels: {
            phrase: {
              nominal:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.phrase.nominal,
              adjectival:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.phrase.adjectival,
              adverbial:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.phrase.adverbial,
            },
            clause: {
              nominal:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.clause.nominal,
              adjectival:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.clause.adjectival,
              adverbial:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].labels.clause.adverbial,
            },
            adverbialPhrase:
              xmlSentenceStructureElementNotation[
                "sentence-constituent-labeling"
              ].labels["adverbial-phrase"],
          },
          placement: {
            phrase: {
              nominal:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.phrase.nominal,
              adjectival:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.phrase.adjectival,
              adverbial:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.phrase.adverbial,
            },
            clause: {
              nominal:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.clause.nominal,
              adjectival:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.clause.adjectival,
              adverbial:
                xmlSentenceStructureElementNotation[
                  "sentence-constituent-labeling"
                ].placement.clause.adverbial,
            },
            adverbialPhrase:
              xmlSentenceStructureElementNotation[
                "sentence-constituent-labeling"
              ].placement["adverbial-phrase"],
          },
          color:
            xmlSentenceStructureElementNotation[
              "sentence-constituent-labeling"
            ]["@_color"],
        },
      }),
      encode: (sentenceStructureElementNotation) => ({
        "range-marking": {
          "core-sentence-element": xmlRangeMarkerToRangeMarker.encode(
            sentenceStructureElementNotation.rangeMarking.coreSentenceElement,
          ),
          "sentence-constituent": {
            phrase: {
              nominal: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.phrase.nominal,
              ),
              adjectival: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.phrase.adjectival,
              ),
              adverbial: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.phrase.adverbial,
              ),
            },
            clause: {
              nominal: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.clause.nominal,
              ),
              adjectival: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.clause.adjectival,
              ),
              adverbial: xmlRangeMarkerToRangeMarker.encode(
                sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.clause.adverbial,
              ),
            },
            "adverbial-phrase": xmlRangeMarkerToRangeMarker.encode(
              sentenceStructureElementNotation.rangeMarking.sentenceConstituent
                .adverbialPhrase,
            ),
          },
          "modification-element": xmlRangeMarkerToRangeMarker.encode(
            sentenceStructureElementNotation.rangeMarking.modificationElement,
          ),
        },
        "sentence-element-labeling": {
          labels: {
            "@_S":
              sentenceStructureElementNotation.sentenceElementLabeling.labels.S,
            "@_V":
              sentenceStructureElementNotation.sentenceElementLabeling.labels.V,
            "@_O":
              sentenceStructureElementNotation.sentenceElementLabeling.labels.O,
            "@_C":
              sentenceStructureElementNotation.sentenceElementLabeling.labels.C,
            "@_M":
              sentenceStructureElementNotation.sentenceElementLabeling.labels.M,
          },
          placement: {
            "core-sentence-element":
              sentenceStructureElementNotation.sentenceElementLabeling.placement
                .coreSentenceElement,
            "sentence-constituent": {
              phrase: {
                nominal:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.phrase.nominal,
                adjectival:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.phrase.adjectival,
                adverbial:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.phrase.adverbial,
              },
              clause: {
                nominal:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.clause.nominal,
                adjectival:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.clause.adjectival,
                adverbial:
                  sentenceStructureElementNotation.sentenceElementLabeling
                    .placement.sentenceConstituent.clause.adverbial,
              },
              "adverbial-phrase":
                sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.adverbialPhrase,
            },
          },
          "@_color":
            sentenceStructureElementNotation.sentenceElementLabeling.color,
          "label-suffixes": {
            "@_show-nesting-depth-primes":
              sentenceStructureElementNotation.sentenceElementLabeling
                .labelSuffixes.showNestingDepthPrimes,
            "@_show-conjunct-numbering":
              sentenceStructureElementNotation.sentenceElementLabeling
                .labelSuffixes.showConjunctNumbering,
          },
        },
        "sentence-constituent-labeling": {
          labels: {
            phrase: {
              nominal:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.phrase.nominal,
              adjectival:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.phrase.adjectival,
              adverbial:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.phrase.adverbial,
            },
            clause: {
              nominal:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.clause.nominal,
              adjectival:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.clause.adjectival,
              adverbial:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .labels.clause.adverbial,
            },
            "adverbial-phrase":
              sentenceStructureElementNotation.sentenceConstituentLabeling
                .labels.adverbialPhrase,
          },
          placement: {
            phrase: {
              nominal:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.phrase.nominal,
              adjectival:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.phrase.adjectival,
              adverbial:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.phrase.adverbial,
            },
            clause: {
              nominal:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.clause.nominal,
              adjectival:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.clause.adjectival,
              adverbial:
                sentenceStructureElementNotation.sentenceConstituentLabeling
                  .placement.clause.adverbial,
            },
            "adverbial-phrase":
              sentenceStructureElementNotation.sentenceConstituentLabeling
                .placement.adverbialPhrase,
          },
          "@_color":
            sentenceStructureElementNotation.sentenceConstituentLabeling.color,
        },
      }),
    },
  );

const XMLModificationNotationSchema = z.object({
  arrow: z.object({
    "@_type": z.literal(["curved", "orthogonal"]),
    "@_color": z.literal(colorOptions),
  }),
});

const xmlModificationNotationToModificationNotation = z.codec(
  XMLModificationNotationSchema,
  ModificationNotationSchema,
  {
    decode: (xmlModificationNotation) => ({
      arrow: {
        type: xmlModificationNotation.arrow["@_type"],
        color: xmlModificationNotation.arrow["@_color"],
      },
    }),
    encode: (modificationNotation) => ({
      arrow: {
        "@_type": modificationNotation.arrow.type,
        "@_color": modificationNotation.arrow.color,
      },
    }),
  },
);

const XMLSentenceStructureDiagramNotation = z.union([
  z.object({
    "sentence-structure-diagram-notation": z.object({
      "@_xmlns": z.literal("https://utlis.github.io/sv-marker/"),
      "@_version": z.literal("0.1.0"),
      canvas: XMLCanvasSchema,
      theme: XMLThemeSchema,
      "@_enable-reflow": z.literal("false"),
      "sentence-structure-element-notation":
        XMLSentenceStructureElementNotationSchema,
      "modification-notation": XMLModificationNotationSchema,
      "coordination-notation": z.object({
        layout: z.object({
          "@_direction": z.literal("horizontal"),
        }),
        "range-marking": z.object({
          coordinator: XMLRangeMarkerSchema,
          correlative: XMLRangeMarkerSchema,
          conjunct: XMLRangeMarkerSchema,
        }),
        "group-indicator": z.optional(
          z.object({
            "bus-connector": z.object({
              "@_color": z.literal(colorOptions),
            }),
          }),
        ),
      }),
    }),
  }),
  z.object({
    "sentence-structure-diagram-notation": z.object({
      "@_xmlns": z.literal("https://utlis.github.io/sv-marker/"),
      "@_version": z.literal("0.1.0"),
      canvas: XMLCanvasSchema,
      theme: XMLThemeSchema,
      "@_enable-reflow": z.literal("true"),
      "sentence-structure-element-notation":
        XMLSentenceStructureElementNotationSchema,
      "modification-notation": XMLModificationNotationSchema,
      "coordination-notation": z.object({
        layout: z.object({
          "@_direction": z.literal("vertical"),
        }),
        "range-marking": z.object({
          coordinator: XMLRangeMarkerSchema,
          correlative: XMLRangeMarkerSchema,
          conjunct: XMLRangeMarkerSchema,
        }),
        "group-indicator": z.optional(
          z.union([
            z.object({
              bracket: z.object({
                "@_bracket-type": z.literal(bracketTypeOptions),
                "@_placement": z.literal(["left", "both-sides"]),
                "@_color": z.literal(colorOptions),
              }),
            }),
            z.object({
              "bus-connector": z.object({
                "@_color": z.literal(colorOptions),
              }),
            }),
          ]),
        ),
      }),
      "layout-strategy": z.union([
        z.object({
          "@_line-break-strategy": z.literal("greedy-word-wrap"),
        }),
        z.object({
          "@_line-break-strategy": z.literal("largest-boundary-first"),
          "@_continuation-line-start": z.literal([
            "content-start",
            "scope-start",
          ]),
        }),
      ]),
    }),
  }),
]);

const xmlSentenceStructureDiagramNotationToSentenceStructureDiagramNotation =
  z.codec(
    XMLSentenceStructureDiagramNotation,
    SentenceStructureDiagramNotationSchema,
    {
      decode: (xmlSentenceStructureDiagramNotation) => {
        if (
          xmlSentenceStructureDiagramNotation[
            "sentence-structure-diagram-notation"
          ]["@_enable-reflow"] === "false"
        ) {
          return {
            canvas: xmlCanvasToCanvas.decode(
              xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ].canvas,
            ),
            theme: xmlThemeToTheme.decode(
              xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ].theme,
            ),
            enableReflow: false,
            sentenceStructureElementNotation:
              xmlSentenceStructureElementNotationToSentenceStructureElementNotation.decode(
                xmlSentenceStructureDiagramNotation[
                  "sentence-structure-diagram-notation"
                ]["sentence-structure-element-notation"],
              ),
            modificationNotation:
              xmlModificationNotationToModificationNotation.decode(
                xmlSentenceStructureDiagramNotation[
                  "sentence-structure-diagram-notation"
                ]["modification-notation"],
              ),
            coordinationNotation: {
              layout: {
                direction:
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"].layout["@_direction"],
              },
              rangeMarking: {
                coordinator: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].coordinator,
                ),
                correlative: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].correlative,
                ),
                conjunct: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].conjunct,
                ),
              },
              groupIndicator: xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ]["coordination-notation"]["group-indicator"]
                ? {
                    type: "bus-connector",
                    color:
                      xmlSentenceStructureDiagramNotation[
                        "sentence-structure-diagram-notation"
                      ]["coordination-notation"]["group-indicator"][
                        "bus-connector"
                      ]["@_color"],
                  }
                : {
                    type: "none",
                  },
            },
          } satisfies SentenceStructureDiagramNotation;
        } else {
          return {
            canvas: xmlCanvasToCanvas.decode(
              xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ].canvas,
            ),
            theme: xmlThemeToTheme.decode(
              xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ].theme,
            ),
            enableReflow: true,
            sentenceStructureElementNotation:
              xmlSentenceStructureElementNotationToSentenceStructureElementNotation.decode(
                xmlSentenceStructureDiagramNotation[
                  "sentence-structure-diagram-notation"
                ]["sentence-structure-element-notation"],
              ),
            modificationNotation:
              xmlModificationNotationToModificationNotation.decode(
                xmlSentenceStructureDiagramNotation[
                  "sentence-structure-diagram-notation"
                ]["modification-notation"],
              ),
            coordinationNotation: {
              layout: {
                direction:
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"].layout["@_direction"],
              },
              rangeMarking: {
                coordinator: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].coordinator,
                ),
                correlative: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].correlative,
                ),
                conjunct: xmlRangeMarkerToRangeMarker.decode(
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["range-marking"].conjunct,
                ),
              },
              groupIndicator: xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ]["coordination-notation"]["group-indicator"]
                ? "bracket" in
                  xmlSentenceStructureDiagramNotation[
                    "sentence-structure-diagram-notation"
                  ]["coordination-notation"]["group-indicator"]
                  ? {
                      type: "bracket",
                      bracketType:
                        xmlSentenceStructureDiagramNotation[
                          "sentence-structure-diagram-notation"
                        ]["coordination-notation"]["group-indicator"].bracket[
                          "@_bracket-type"
                        ],
                      placement:
                        xmlSentenceStructureDiagramNotation[
                          "sentence-structure-diagram-notation"
                        ]["coordination-notation"]["group-indicator"].bracket[
                          "@_placement"
                        ],
                      color:
                        xmlSentenceStructureDiagramNotation[
                          "sentence-structure-diagram-notation"
                        ]["coordination-notation"]["group-indicator"].bracket[
                          "@_color"
                        ],
                    }
                  : {
                      type: "bus-connector",
                      color:
                        xmlSentenceStructureDiagramNotation[
                          "sentence-structure-diagram-notation"
                        ]["coordination-notation"]["group-indicator"][
                          "bus-connector"
                        ]["@_color"],
                    }
                : {
                    type: "none",
                  },
            },
            layoutStrategy:
              xmlSentenceStructureDiagramNotation[
                "sentence-structure-diagram-notation"
              ]["layout-strategy"]["@_line-break-strategy"] ===
              "greedy-word-wrap"
                ? {
                    lineBreakStrategy: "greedy-word-wrap",
                  }
                : {
                    lineBreakStrategy: "largest-boundary-first",
                    continuationLineStart:
                      xmlSentenceStructureDiagramNotation[
                        "sentence-structure-diagram-notation"
                      ]["layout-strategy"]["@_continuation-line-start"],
                  },
          } satisfies SentenceStructureDiagramNotation;
        }
      },
      encode: (sentenceStructureDiagramNotation) => {
        if (!sentenceStructureDiagramNotation.enableReflow) {
          return {
            "sentence-structure-diagram-notation": {
              "@_xmlns": "https://utlis.github.io/sv-marker/",
              "@_version": "0.1.0",
              canvas: xmlCanvasToCanvas.encode(
                sentenceStructureDiagramNotation.canvas,
              ),
              theme: xmlThemeToTheme.encode(
                sentenceStructureDiagramNotation.theme,
              ),
              "@_enable-reflow": "false",
              "sentence-structure-element-notation":
                xmlSentenceStructureElementNotationToSentenceStructureElementNotation.encode(
                  sentenceStructureDiagramNotation.sentenceStructureElementNotation,
                ),
              "modification-notation":
                xmlModificationNotationToModificationNotation.encode(
                  sentenceStructureDiagramNotation.modificationNotation,
                ),
              "coordination-notation": {
                layout: {
                  "@_direction":
                    sentenceStructureDiagramNotation.coordinationNotation.layout
                      .direction,
                },
                "range-marking": {
                  coordinator: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.coordinator,
                  ),
                  correlative: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.correlative,
                  ),
                  conjunct: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.conjunct,
                  ),
                },
                "group-indicator":
                  sentenceStructureDiagramNotation.coordinationNotation
                    .groupIndicator.type === "bus-connector"
                    ? {
                        "bus-connector": {
                          "@_color":
                            sentenceStructureDiagramNotation
                              .coordinationNotation.groupIndicator.color,
                        },
                      }
                    : undefined,
              },
            },
          } satisfies z.infer<typeof XMLSentenceStructureDiagramNotation>;
        } else {
          return {
            "sentence-structure-diagram-notation": {
              "@_xmlns": "https://utlis.github.io/sv-marker/",
              "@_version": "0.1.0",
              canvas: xmlCanvasToCanvas.encode(
                sentenceStructureDiagramNotation.canvas,
              ),
              theme: xmlThemeToTheme.encode(
                sentenceStructureDiagramNotation.theme,
              ),
              "@_enable-reflow": "true",
              "sentence-structure-element-notation":
                xmlSentenceStructureElementNotationToSentenceStructureElementNotation.encode(
                  sentenceStructureDiagramNotation.sentenceStructureElementNotation,
                ),
              "modification-notation":
                xmlModificationNotationToModificationNotation.encode(
                  sentenceStructureDiagramNotation.modificationNotation,
                ),
              "coordination-notation": {
                layout: {
                  "@_direction":
                    sentenceStructureDiagramNotation.coordinationNotation.layout
                      .direction,
                },
                "range-marking": {
                  coordinator: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.coordinator,
                  ),
                  correlative: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.correlative,
                  ),
                  conjunct: xmlRangeMarkerToRangeMarker.encode(
                    sentenceStructureDiagramNotation.coordinationNotation
                      .rangeMarking.conjunct,
                  ),
                },
                "group-indicator":
                  sentenceStructureDiagramNotation.coordinationNotation
                    .groupIndicator.type === "bracket"
                    ? {
                        bracket: {
                          "@_bracket-type":
                            sentenceStructureDiagramNotation
                              .coordinationNotation.groupIndicator.bracketType,
                          "@_placement":
                            sentenceStructureDiagramNotation
                              .coordinationNotation.groupIndicator.placement,
                          "@_color":
                            sentenceStructureDiagramNotation
                              .coordinationNotation.groupIndicator.color,
                        },
                      }
                    : sentenceStructureDiagramNotation.coordinationNotation
                          .groupIndicator.type === "bus-connector"
                      ? {
                          "bus-connector": {
                            "@_color":
                              sentenceStructureDiagramNotation
                                .coordinationNotation.groupIndicator.color,
                          },
                        }
                      : undefined,
              },
              "layout-strategy":
                sentenceStructureDiagramNotation.layoutStrategy
                  .lineBreakStrategy === "greedy-word-wrap"
                  ? {
                      "@_line-break-strategy": "greedy-word-wrap",
                    }
                  : {
                      "@_line-break-strategy": "largest-boundary-first",
                      "@_continuation-line-start":
                        sentenceStructureDiagramNotation.layoutStrategy
                          .continuationLineStart,
                    },
            },
          } satisfies z.infer<typeof XMLSentenceStructureDiagramNotation>;
        }
      },
    },
  );

export const xmlStringToSentenceStructureDiagramNotation = z.codec(
  z.string(),
  SentenceStructureDiagramNotationSchema,
  {
    decode: (xmlString) => {
      try {
        return xmlSentenceStructureDiagramNotationToSentenceStructureDiagramNotation.decode(
          XMLSentenceStructureDiagramNotation.parse(
            new XMLParser({
              ignoreAttributes: false,
              parseTagValue: false,
            }).parse(xmlString),
          ),
        ) satisfies SentenceStructureDiagramNotation;
      } catch {
        return null as any;
      }
    },
    encode: (sentenceStructureDiagramNotation) =>
      new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true,
      }).build(
        xmlSentenceStructureDiagramNotationToSentenceStructureDiagramNotation.encode(
          sentenceStructureDiagramNotation,
        ) satisfies z.infer<typeof XMLSentenceStructureDiagramNotation>,
      ),
  },
);
