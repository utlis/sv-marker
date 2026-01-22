import * as z from "zod";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  coreSentenceElementAllowedSentenceElementNameOptions,
  sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap,
  SentenceStructureDocumentSchema,
  type SentenceStructureDocument,
} from "../schema.js";
import {
  simplifiedSentenceStructureDocumentToSentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
} from "./simplified-codec.js";

const XMLSentenceStructureDocumentSchema = z.object({
  "sentence-structure-document": z.object({
    "@_xmlns": z.literal("https://utlis.github.io/sv-marker/"),
    "@_version": z.literal("0.1.0"),
    sentences: z.object({
      sentence: z.array(
        z.object({
          words: z.object({
            word: z.array(
              z.object({
                "@_index": z.string(),
                "#text": z.string(),
                "@_whitespace-after": z.string(),
              }),
            ),
          }),
          "sentence-structure-elements": z.optional(
            z.object({
              "sentence-structure-element": z.array(
                z.union([
                  z.object({
                    "@_kind": z.literal("core-sentence-element"),
                    "@_index": z.string(),
                    "@_start-word-index": z.string(),
                    "@_end-word-index": z.string(),
                    "@_sentence-element-name": z.optional(
                      z.literal(
                        coreSentenceElementAllowedSentenceElementNameOptions,
                      ),
                    ),
                  }),
                  z.object({
                    "@_kind": z.literal("sentence-constituent"),
                    "@_type": z.literal("phrase"),
                    "@_usage": z.literal([
                      "nominal",
                      "adjectival",
                      "adverbial",
                    ]),
                    "@_index": z.string(),
                    "@_start-word-index": z.string(),
                    "@_end-word-index": z.string(),
                    "@_sentence-element-name": z.optional(
                      z.literal(
                        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                          "phrase"
                        ],
                      ),
                    ),
                  }),
                  z.object({
                    "@_kind": z.literal("sentence-constituent"),
                    "@_type": z.literal("clause"),
                    "@_usage": z.literal([
                      "nominal",
                      "adjectival",
                      "adverbial",
                    ]),
                    "@_index": z.string(),
                    "@_start-word-index": z.string(),
                    "@_end-word-index": z.string(),
                    "@_sentence-element-name": z.optional(
                      z.literal(
                        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                          "clause"
                        ],
                      ),
                    ),
                  }),
                  z.object({
                    "@_kind": z.literal("sentence-constituent"),
                    "@_type": z.literal("adverbial-phrase"),
                    "@_index": z.string(),
                    "@_start-word-index": z.string(),
                    "@_end-word-index": z.string(),
                    "@_sentence-element-name": z.optional(
                      z.literal(
                        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                          "adverbial-phrase"
                        ],
                      ),
                    ),
                  }),
                  z.object({
                    "@_kind": z.literal("modification-element"),
                    "@_index": z.string(),
                    "@_start-word-index": z.string(),
                    "@_end-word-index": z.string(),
                  }),
                ]),
              ),
            }),
          ),
          modifications: z.optional(
            z.object({
              modification: z.array(
                z.object({
                  "@_modifier-sentence-structure-element-index": z.string(),
                  "@_modified-sentence-structure-element-index": z.string(),
                }),
              ),
            }),
          ),
          coordinations: z.optional(
            z.object({
              coordination: z.array(
                z.object({
                  "coordination-part": z.array(
                    z.object({
                      "@_type": z.literal([
                        "coordinator",
                        "correlative",
                        "conjunct",
                      ]),
                      "@_start-word-index": z.string(),
                      "@_end-word-index": z.string(),
                    }),
                  ),
                }),
              ),
            }),
          ),
        }),
      ),
    }),
  }),
});

const xmlSentenceStructureDocumentToSentenceStructureDocument = z.codec(
  XMLSentenceStructureDocumentSchema,
  SentenceStructureDocumentSchema,
  {
    decode: (xmlSentenceStructureDocument) =>
      simplifiedSentenceStructureDocumentToSentenceStructureDocument.decode({
        sentences: xmlSentenceStructureDocument[
          "sentence-structure-document"
        ].sentences.sentence.map((sentence) => ({
          words: sentence.words.word.map((word) => ({
            index: Number(word["@_index"]),
            text: word["#text"],
            whitespaceAfter: word["@_whitespace-after"],
          })),
          sentenceStructureElements:
            sentence["sentence-structure-elements"]?.[
              "sentence-structure-element"
            ].map((sentenceStructureElement) => {
              switch (sentenceStructureElement["@_kind"]) {
                case "core-sentence-element":
                  return {
                    kind: sentenceStructureElement["@_kind"],
                    index: Number(sentenceStructureElement["@_index"]),
                    startWordIndex: Number(
                      sentenceStructureElement["@_start-word-index"],
                    ),
                    endWordIndex: Number(
                      sentenceStructureElement["@_end-word-index"],
                    ),
                    sentenceElementName:
                      sentenceStructureElement["@_sentence-element-name"] ??
                      null,
                  };
                case "sentence-constituent":
                  switch (sentenceStructureElement["@_type"]) {
                    case "phrase":
                    case "clause":
                      return {
                        kind: sentenceStructureElement["@_kind"],
                        type: sentenceStructureElement["@_type"],
                        usage: sentenceStructureElement["@_usage"],
                        index: Number(sentenceStructureElement["@_index"]),
                        startWordIndex: Number(
                          sentenceStructureElement["@_start-word-index"],
                        ),
                        endWordIndex: Number(
                          sentenceStructureElement["@_end-word-index"],
                        ),
                        sentenceElementName:
                          sentenceStructureElement["@_sentence-element-name"] ??
                          null,
                      };
                    case "adverbial-phrase":
                      return {
                        kind: sentenceStructureElement["@_kind"],
                        type: sentenceStructureElement["@_type"],
                        index: Number(sentenceStructureElement["@_index"]),
                        startWordIndex: Number(
                          sentenceStructureElement["@_start-word-index"],
                        ),
                        endWordIndex: Number(
                          sentenceStructureElement["@_end-word-index"],
                        ),
                        sentenceElementName:
                          sentenceStructureElement["@_sentence-element-name"] ??
                          null,
                      };
                    default:
                      sentenceStructureElement satisfies never;
                      throw new Error("Unreachable");
                  }
                case "modification-element":
                  return {
                    kind: sentenceStructureElement["@_kind"],
                    index: Number(sentenceStructureElement["@_index"]),
                    startWordIndex: Number(
                      sentenceStructureElement["@_start-word-index"],
                    ),
                    endWordIndex: Number(
                      sentenceStructureElement["@_end-word-index"],
                    ),
                  };
                default:
                  sentenceStructureElement satisfies never;
                  throw new Error("Unreachable");
              }
            }) ?? [],
          modifications:
            sentence.modifications?.modification.map((modification) => ({
              modifierSentenceStructureElementIndex: Number(
                modification["@_modifier-sentence-structure-element-index"],
              ),
              modifiedSentenceStructureElementIndex: Number(
                modification["@_modified-sentence-structure-element-index"],
              ),
            })) ?? [],
          coordinations:
            sentence.coordinations?.coordination.map((coordination) => ({
              parts: coordination["coordination-part"].map((part) => ({
                type: part["@_type"],
                startWordIndex: Number(part["@_start-word-index"]),
                endWordIndex: Number(part["@_end-word-index"]),
              })),
            })) ?? [],
        })),
      } satisfies SimplifiedSentenceStructureDocument),
    encode: (sentenceStructureDocument) => {
      const simplifiedSentenceStructureDocument =
        simplifiedSentenceStructureDocumentToSentenceStructureDocument.encode(
          sentenceStructureDocument,
        );

      return {
        "sentence-structure-document": {
          "@_xmlns": "https://utlis.github.io/sv-marker/",
          "@_version": "0.1.0",
          sentences: {
            sentence: simplifiedSentenceStructureDocument.sentences.map(
              (sentence) => ({
                words: {
                  word: sentence.words.map((word) => ({
                    "@_index": String(word.index),
                    "#text": word.text,
                    "@_whitespace-after": word.whitespaceAfter,
                  })),
                },
                "sentence-structure-elements": {
                  "sentence-structure-element":
                    sentence.sentenceStructureElements.map(
                      (sentenceStructureElement) => {
                        switch (sentenceStructureElement.kind) {
                          case "core-sentence-element":
                            return {
                              "@_kind": sentenceStructureElement.kind,
                              "@_index": String(sentenceStructureElement.index),
                              "@_start-word-index": String(
                                sentenceStructureElement.startWordIndex,
                              ),
                              "@_end-word-index": String(
                                sentenceStructureElement.endWordIndex,
                              ),
                              "@_sentence-element-name":
                                sentenceStructureElement.sentenceElementName ??
                                undefined,
                            };
                          case "sentence-constituent":
                            switch (sentenceStructureElement.type) {
                              case "phrase":
                              case "clause":
                                return {
                                  "@_kind": sentenceStructureElement.kind,
                                  "@_type": sentenceStructureElement.type,
                                  "@_usage": sentenceStructureElement.usage,
                                  "@_index": String(
                                    sentenceStructureElement.index,
                                  ),
                                  "@_start-word-index": String(
                                    sentenceStructureElement.startWordIndex,
                                  ),
                                  "@_end-word-index": String(
                                    sentenceStructureElement.endWordIndex,
                                  ),
                                  "@_sentence-element-name":
                                    sentenceStructureElement.sentenceElementName ??
                                    undefined,
                                };
                              case "adverbial-phrase":
                                return {
                                  "@_kind": sentenceStructureElement.kind,
                                  "@_type": sentenceStructureElement.type,
                                  "@_index": String(
                                    sentenceStructureElement.index,
                                  ),
                                  "@_start-word-index": String(
                                    sentenceStructureElement.startWordIndex,
                                  ),
                                  "@_end-word-index": String(
                                    sentenceStructureElement.endWordIndex,
                                  ),
                                  "@_sentence-element-name":
                                    sentenceStructureElement.sentenceElementName ??
                                    undefined,
                                };
                              default:
                                sentenceStructureElement satisfies never;
                                throw new Error("Unreachable");
                            }
                          case "modification-element":
                            return {
                              "@_kind": sentenceStructureElement.kind,
                              "@_index": String(sentenceStructureElement.index),
                              "@_start-word-index": String(
                                sentenceStructureElement.startWordIndex,
                              ),
                              "@_end-word-index": String(
                                sentenceStructureElement.endWordIndex,
                              ),
                            };
                          default:
                            sentenceStructureElement satisfies never;
                            throw new Error("Unreachable");
                        }
                      },
                    ),
                },
                modifications: {
                  modification: sentence.modifications.map((modification) => ({
                    "@_modifier-sentence-structure-element-index": String(
                      modification.modifierSentenceStructureElementIndex,
                    ),
                    "@_modified-sentence-structure-element-index": String(
                      modification.modifiedSentenceStructureElementIndex,
                    ),
                  })),
                },
                coordinations: {
                  coordination: sentence.coordinations.map((coordination) => ({
                    "coordination-part": coordination.parts.map((part) => ({
                      "@_type": part.type,
                      "@_start-word-index": String(part.startWordIndex),
                      "@_end-word-index": String(part.endWordIndex),
                    })),
                  })),
                },
              }),
            ),
          },
        },
      } satisfies z.infer<typeof XMLSentenceStructureDocumentSchema>;
    },
  },
);

export const xmlStringToSentenceStructureDocument = z.codec(
  z.string(),
  SentenceStructureDocumentSchema,
  {
    decode: (xmlString) => {
      try {
        return xmlSentenceStructureDocumentToSentenceStructureDocument.decode(
          new XMLParser({
            ignoreAttributes: false,
            isArray: (tagName) =>
              [
                "sentence",
                "word",
                "sentence-structure-element",
                "modification",
                "coordination-part",
                "coordination",
              ].includes(tagName),
            parseTagValue: false,
          }).parse(xmlString),
        ) satisfies SentenceStructureDocument;
      } catch {
        return null as any;
      }
    },
    encode: (sentenceStructureDocument) =>
      new XMLBuilder({
        format: true,
        ignoreAttributes: false,
        suppressEmptyNode: true,
      }).build(
        xmlSentenceStructureDocumentToSentenceStructureDocument.encode(
          sentenceStructureDocument,
        ) satisfies z.infer<typeof XMLSentenceStructureDocumentSchema>,
      ),
  },
);
