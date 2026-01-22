import * as z from "zod";
import {
  coreSentenceElementAllowedSentenceElementNameOptions,
  sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap,
  SentenceStructureDocumentSchema,
  type Coordination,
  type SentenceStructureElement,
  type Modification,
  type Word,
} from "../schema.js";
import { normalizeSentenceStructureDocument } from "../operations.js";

export const SimplifiedSentenceStructureDocumentSchema = z
  .object({
    sentences: z.array(
      z
        .object({
          words: z.array(
            z
              .object({
                index: z.int().nonnegative().meta({
                  title: "インデックス",
                  description: "単語を一意に識別するためのインデックス。",
                }),
                text: z.string().meta({
                  title: "テキスト",
                  description: "単語のテキスト。",
                }),
                whitespaceAfter: z.string().meta({
                  title: "単語の直後の空白",
                  description:
                    "元の文を復元するための、この単語の直後の空白文字列。",
                }),
              })
              .meta({
                title: "単語",
                description: "単語。",
              }),
          ),
          sentenceStructureElements: z.array(
            z
              .union([
                z
                  .object({
                    kind: z.literal("core-sentence-element").meta({
                      title: "区分",
                      description:
                        "文構造要素の区分。`core-sentence-element`は文の主要素を表す。",
                    }),
                    index: z.int().nonnegative().meta({
                      title: "インデックス",
                      description:
                        "文構造要素を一意に識別するためのインデックス。",
                    }),
                    startWordIndex: z.int().nonnegative().meta({
                      title: "開始単語インデックス",
                      description:
                        "文構造要素に含まれる最初の単語のインデックス。",
                    }),
                    endWordIndex: z.int().nonnegative().meta({
                      title: "終了単語インデックス",
                      description:
                        "文構造要素に含まれる最後の単語のインデックス。",
                    }),
                    sentenceElementName: z
                      .nullable(
                        z.literal(
                          coreSentenceElementAllowedSentenceElementNameOptions,
                        ),
                      )
                      .meta({
                        title: "文の要素名",
                        description: "文の要素の名前。",
                      }),
                  })
                  .meta({
                    title: "文の主要素",
                    description:
                      "英文構造図において文の主要素として表される構造要素。主語（S）、動詞（V）、目的語（O）、補語（C）のいずれかとなっており、文の構成要素でないもの。",
                  }),
                z
                  .union([
                    z
                      .object({
                        kind: z.literal("sentence-constituent").meta({
                          title: "区分",
                          description:
                            "文構造要素の区分。`sentence-constituent`は文の構成要素を表す。",
                        }),
                        type: z.literal("phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`phrase`は句を表す。",
                        }),
                        usage: z
                          .literal(["nominal", "adjectival", "adverbial"])
                          .meta({
                            title: "用法",
                            description:
                              "文中での用法。名詞的用法、形容詞的用法、副詞的用法のいずれかからなる。",
                          }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        startWordIndex: z.int().nonnegative().meta({
                          title: "開始単語インデックス",
                          description:
                            "文構造要素に含まれる最初の単語のインデックス。",
                        }),
                        endWordIndex: z.int().nonnegative().meta({
                          title: "終了単語インデックス",
                          description:
                            "文構造要素に含まれる最後の単語のインデックス。",
                        }),
                        sentenceElementName: z
                          .nullable(
                            z.literal(
                              sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                                "phrase"
                              ],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "句",
                        description: "任意の準動詞句。",
                      }),
                    z
                      .object({
                        kind: z.literal("sentence-constituent").meta({
                          title: "区分",
                          description:
                            "文構造要素の区分。`sentence-constituent`は文の構成要素を表す。",
                        }),
                        type: z.literal("clause").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`clause`は節を表す。",
                        }),
                        usage: z
                          .literal(["nominal", "adjectival", "adverbial"])
                          .meta({
                            title: "用法",
                            description:
                              "文中での用法。名詞的用法、形容詞的用法、副詞的用法のいずれかからなる。",
                          }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        startWordIndex: z.int().nonnegative().meta({
                          title: "開始単語インデックス",
                          description:
                            "文構造要素に含まれる最初の単語のインデックス。",
                        }),
                        endWordIndex: z.int().nonnegative().meta({
                          title: "終了単語インデックス",
                          description:
                            "文構造要素に含まれる最後の単語のインデックス。",
                        }),
                        sentenceElementName: z
                          .nullable(
                            z.literal(
                              sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                                "clause"
                              ],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "節",
                        description: "任意の節。",
                      }),
                    z
                      .object({
                        kind: z.literal("sentence-constituent").meta({
                          title: "区分",
                          description:
                            "文構造要素の区分。`sentence-constituent`は文の構成要素を表す。",
                        }),
                        type: z.literal("adverbial-phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`adverbial-phrase`は修飾語句を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        startWordIndex: z.int().nonnegative().meta({
                          title: "開始単語インデックス",
                          description:
                            "文構造要素に含まれる最初の単語のインデックス。",
                        }),
                        endWordIndex: z.int().nonnegative().meta({
                          title: "終了単語インデックス",
                          description:
                            "文構造要素に含まれる最後の単語のインデックス。",
                        }),
                        sentenceElementName: z
                          .nullable(
                            z.literal(
                              sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
                                "adverbial-phrase"
                              ],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "修飾語句",
                        description:
                          "前置詞句、副詞句のいずれかからなる構造要素。",
                      }),
                  ])
                  .meta({
                    title: "文の構成要素",
                    description: "句、節、修飾語句のいずれかからなる構造要素。",
                  }),
                z
                  .object({
                    kind: z.literal("modification-element").meta({
                      title: "区分",
                      description:
                        "文構造要素の区分。`modification-element`は修飾関係の要素を表す。",
                    }),
                    index: z.int().nonnegative().meta({
                      title: "インデックス",
                      description:
                        "文構造要素を一意に識別するためのインデックス。",
                    }),
                    startWordIndex: z.int().nonnegative().meta({
                      title: "開始単語インデックス",
                      description:
                        "文構造要素に含まれる最初の単語のインデックス。",
                    }),
                    endWordIndex: z.int().nonnegative().meta({
                      title: "終了単語インデックス",
                      description:
                        "文構造要素に含まれる最後の単語のインデックス。",
                    }),
                  })
                  .meta({
                    title: "修飾関係の要素",
                    description:
                      "修飾関係の修飾要素あるいは被修飾要素を表す構造要素。修飾要素あるいは被修飾要素が文の主要素でも文の構成要素でもない場合にのみ使用される。",
                  }),
              ])
              .meta({
                title: "文構造要素",
                description:
                  "1つ以上の連続した単語からなる構造要素。文の主要素、文の構成要素、修飾関係の要素のいずれかからなる。",
              }),
          ),
          modifications: z.array(
            z
              .object({
                modifierSentenceStructureElementIndex: z
                  .int()
                  .nonnegative()
                  .meta({
                    title: "修飾要素インデックス",
                    description:
                      "修飾関係の修飾要素となる文構造要素のインデックス。",
                  }),
                modifiedSentenceStructureElementIndex: z
                  .int()
                  .nonnegative()
                  .meta({
                    title: "被修飾要素インデックス",
                    description:
                      "修飾関係の被修飾要素となる文構造要素のインデックス。",
                  }),
              })
              .meta({
                title: "修飾関係",
                description: "修飾要素と被修飾要素の関係。",
              }),
          ),
          coordinations: z.array(
            z
              .object({
                parts: z.array(
                  z
                    .object({
                      type: z
                        .literal(["coordinator", "correlative", "conjunct"])
                        .meta({
                          title: "種別",
                          description:
                            "並列関係の構成要素の種別。等位接続詞、相関接続詞、並列要素のいずれかからなる。",
                        }),
                      startWordIndex: z.int().nonnegative().meta({
                        title: "開始単語インデックス",
                        description:
                          "並列関係の構成要素に含まれる最初の単語のインデックス。",
                      }),
                      endWordIndex: z.int().nonnegative().meta({
                        title: "終了単語インデックス",
                        description:
                          "並列関係の構成要素に含まれる最後の単語のインデックス。",
                      }),
                    })
                    .meta({
                      title: "並列関係の構成要素",
                      description:
                        "並列関係を構成する個々の要素。等位接続詞、相関接続詞、並列要素のいずれかからなる。",
                    }),
                ),
              })
              .meta({
                title: "並列関係",
                description: "複数の要素が並列に結びつけられている関係。",
              }),
          ),
        })
        .meta({
          title: "文",
          description: "1つの文に関する情報。",
        })
        .refine(
          (sentence) =>
            sentence.words
              .toSorted((a, b) => a.index - b.index)
              .every((word, index) => word.index === index),
          {
            error:
              "単語のインデックスが0から始まる連続した整数ではありません。",
          },
        )
        .refine(
          (sentence) =>
            sentence.sentenceStructureElements
              .toSorted((a, b) => a.index - b.index)
              .every(
                (sentenceStructureElement, index) =>
                  sentenceStructureElement.index === index,
              ),
          {
            error:
              "文構造要素のインデックスが0から始まる連続した整数ではありません。",
          },
        )
        .refine(
          (sentence) =>
            sentence.sentenceStructureElements.every(
              (sentenceStructureElement) =>
                sentenceStructureElement.startWordIndex <
                  sentence.words.length &&
                sentenceStructureElement.endWordIndex < sentence.words.length,
            ),
          { error: "文構造要素が存在しない単語を参照しています。" },
        )
        .refine(
          (sentence) =>
            sentence.modifications.every(
              (modification) =>
                modification.modifierSentenceStructureElementIndex <
                  sentence.sentenceStructureElements.length &&
                modification.modifiedSentenceStructureElementIndex <
                  sentence.sentenceStructureElements.length,
            ),
          { error: "修飾関係が存在しない文構造要素を参照しています。" },
        )
        .refine(
          (sentence) =>
            sentence.coordinations.every((coordination) =>
              coordination.parts.every(
                (part) =>
                  part.startWordIndex < sentence.words.length &&
                  part.endWordIndex < sentence.words.length,
              ),
            ),
          { error: "並列関係の構成要素が存在しない単語を参照しています。" },
        ),
    ),
  })
  .meta({
    title: "英文構造に関する情報",
    description: "英文構造図が共通して内部的に持つ英文構造に関する情報。",
  });
export type SimplifiedSentenceStructureDocument = z.infer<
  typeof SimplifiedSentenceStructureDocumentSchema
>;

export const simplifiedSentenceStructureDocumentToSentenceStructureDocument =
  z.codec(
    SimplifiedSentenceStructureDocumentSchema,
    SentenceStructureDocumentSchema,
    {
      decode: (simplifiedSentenceStructureDocument) => {
        const sortedSimplifiedSentenceStructureDocument = {
          sentences: simplifiedSentenceStructureDocument.sentences.map(
            (sentence) => ({
              words: sentence.words.toSorted((a, b) => a.index - b.index),
              sentenceStructureElements:
                sentence.sentenceStructureElements.toSorted(
                  (a, b) => a.index - b.index,
                ),
              modifications: sentence.modifications,
              coordinations: sentence.coordinations.map((coordination) => ({
                parts: coordination.parts.toSorted(
                  (a, b) => a.startWordIndex - b.startWordIndex,
                ),
              })),
            }),
          ),
        } satisfies SimplifiedSentenceStructureDocument;

        return normalizeSentenceStructureDocument({
          sentences: sortedSimplifiedSentenceStructureDocument.sentences.map(
            (sentence, index) => {
              const wordIds = sentence.words.map(() => crypto.randomUUID());
              const sentenceStructureElementIds =
                sentence.sentenceStructureElements.map(() =>
                  crypto.randomUUID(),
                );

              return {
                id: crypto.randomUUID(),
                index,
                words: sentence.words.map((word, index) => ({
                  id: wordIds[index]!,
                  index: word.index,
                  text: word.text,
                  whitespaceAfter: word.whitespaceAfter,
                })) satisfies Word[],
                sentenceStructureElements:
                  sentence.sentenceStructureElements.map(
                    (sentenceStructureElement, index) =>
                      sentenceStructureElement.kind === "core-sentence-element"
                        ? ({
                            kind: sentenceStructureElement.kind,
                            id: sentenceStructureElementIds[index]!,
                            startWordId:
                              wordIds[sentenceStructureElement.startWordIndex]!,
                            endWordId:
                              wordIds[sentenceStructureElement.endWordIndex]!,
                            sentenceElementName:
                              sentenceStructureElement.sentenceElementName,
                          } satisfies SentenceStructureElement)
                        : sentenceStructureElement.kind ===
                            "sentence-constituent"
                          ? sentenceStructureElement.type === "phrase" ||
                            sentenceStructureElement.type === "clause"
                            ? ({
                                kind: sentenceStructureElement.kind,
                                type: sentenceStructureElement.type,
                                usage: sentenceStructureElement.usage,
                                id: sentenceStructureElementIds[index]!,
                                startWordId:
                                  wordIds[
                                    sentenceStructureElement.startWordIndex
                                  ]!,
                                endWordId:
                                  wordIds[
                                    sentenceStructureElement.endWordIndex
                                  ]!,
                                sentenceElementName:
                                  sentenceStructureElement.sentenceElementName,
                              } satisfies SentenceStructureElement)
                            : ({
                                kind: sentenceStructureElement.kind,
                                type: sentenceStructureElement.type,
                                id: sentenceStructureElementIds[index]!,
                                startWordId:
                                  wordIds[
                                    sentenceStructureElement.startWordIndex
                                  ]!,
                                endWordId:
                                  wordIds[
                                    sentenceStructureElement.endWordIndex
                                  ]!,
                                sentenceElementName:
                                  sentenceStructureElement.sentenceElementName,
                              } satisfies SentenceStructureElement)
                          : ({
                              kind: sentenceStructureElement.kind,
                              id: sentenceStructureElementIds[index]!,
                              startWordId:
                                wordIds[
                                  sentenceStructureElement.startWordIndex
                                ]!,
                              endWordId:
                                wordIds[sentenceStructureElement.endWordIndex]!,
                            } satisfies SentenceStructureElement),
                  ) satisfies SentenceStructureElement[],
                modifications: sentence.modifications.map((modification) => {
                  return {
                    id: crypto.randomUUID(),
                    modifierSentenceStructureElementId:
                      sentenceStructureElementIds[
                        modification.modifierSentenceStructureElementIndex
                      ]!,
                    modifiedSentenceStructureElementId:
                      sentenceStructureElementIds[
                        modification.modifiedSentenceStructureElementIndex
                      ]!,
                  };
                }) satisfies Modification[],
                coordinations: sentence.coordinations.map((coordination) => ({
                  id: crypto.randomUUID(),
                  parts: coordination.parts.map((part, index) => ({
                    type: part.type,
                    id: crypto.randomUUID(),
                    index,
                    startWordId: wordIds[part.startWordIndex]!,
                    endWordId: wordIds[part.endWordIndex]!,
                  })),
                })) satisfies Coordination[],
              };
            },
          ),
        });
      },
      encode: (sentenceStructureDocument) => ({
        sentences: sentenceStructureDocument.sentences.map((sentence) => ({
          words: sentence.words.map((word) => ({
            index: word.index,
            text: word.text,
            whitespaceAfter: word.whitespaceAfter,
          })) satisfies SimplifiedSentenceStructureDocument["sentences"][number]["words"],
          sentenceStructureElements: sentence.sentenceStructureElements.map(
            (sentenceStructureElement, index) =>
              sentenceStructureElement.kind === "core-sentence-element"
                ? ({
                    kind: sentenceStructureElement.kind,
                    index,
                    startWordIndex: sentence.words.findIndex(
                      (word) =>
                        word.id === sentenceStructureElement.startWordId,
                    )!,
                    endWordIndex: sentence.words.findIndex(
                      (word) => word.id === sentenceStructureElement.endWordId,
                    )!,
                    sentenceElementName:
                      sentenceStructureElement.sentenceElementName,
                  } satisfies SimplifiedSentenceStructureDocument["sentences"][number]["sentenceStructureElements"][number])
                : sentenceStructureElement.kind === "sentence-constituent"
                  ? sentenceStructureElement.type === "phrase" ||
                    sentenceStructureElement.type === "clause"
                    ? ({
                        kind: sentenceStructureElement.kind,
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index,
                        startWordIndex: sentence.words.findIndex(
                          (word) =>
                            word.id === sentenceStructureElement.startWordId,
                        )!,
                        endWordIndex: sentence.words.findIndex(
                          (word) =>
                            word.id === sentenceStructureElement.endWordId,
                        )!,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SimplifiedSentenceStructureDocument["sentences"][number]["sentenceStructureElements"][number])
                    : ({
                        kind: sentenceStructureElement.kind,
                        type: sentenceStructureElement.type,
                        index,
                        startWordIndex: sentence.words.findIndex(
                          (word) =>
                            word.id === sentenceStructureElement.startWordId,
                        )!,
                        endWordIndex: sentence.words.findIndex(
                          (word) =>
                            word.id === sentenceStructureElement.endWordId,
                        )!,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SimplifiedSentenceStructureDocument["sentences"][number]["sentenceStructureElements"][number])
                  : ({
                      kind: sentenceStructureElement.kind,
                      index,
                      startWordIndex: sentence.words.findIndex(
                        (word) =>
                          word.id === sentenceStructureElement.startWordId,
                      )!,
                      endWordIndex: sentence.words.findIndex(
                        (word) =>
                          word.id === sentenceStructureElement.endWordId,
                      )!,
                    } satisfies SimplifiedSentenceStructureDocument["sentences"][number]["sentenceStructureElements"][number]),
          ) satisfies SimplifiedSentenceStructureDocument["sentences"][number]["sentenceStructureElements"],
          modifications: sentence.modifications.map((modification) => ({
            modifierSentenceStructureElementIndex:
              sentence.sentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  modification.modifierSentenceStructureElementId,
              ),
            modifiedSentenceStructureElementIndex:
              sentence.sentenceStructureElements.findIndex(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  modification.modifiedSentenceStructureElementId,
              ),
          })) satisfies SimplifiedSentenceStructureDocument["sentences"][number]["modifications"],
          coordinations: sentence.coordinations.map((coordination) => ({
            parts: coordination.parts.map((part) => ({
              type: part.type,
              startWordIndex: sentence.words.findIndex(
                (word) => word.id === part.startWordId,
              )!,
              endWordIndex: sentence.words.findIndex(
                (word) => word.id === part.endWordId,
              )!,
            })),
          })) satisfies SimplifiedSentenceStructureDocument["sentences"][number]["coordinations"],
        })),
      }),
    },
  );
