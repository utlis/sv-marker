import * as z from "zod";
import {
  allowedSentenceElementNameOptions,
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
  type SentenceStructureDocument,
  type SimplifiedSentenceStructureDocument,
  type Word,
} from "@sv-marker/sentence-structure-document";

export const SentenceStructureAnnotationsOutputSchema = z
  .object({
    sentences: z.array(
      z
        .object({
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
                    text: z.string().meta({
                      title: "テキスト",
                      description: "この文構造要素に対応する文中のテキスト。",
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
                          allowedSentenceElementNameOptions[
                            "core-sentence-element"
                          ],
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
                        type: z.literal("verbal-phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`verbal-phrase`は準動詞句を表す。",
                        }),
                        usage: z.literal("nominal").meta({
                          title: "用法",
                          description:
                            "文中での用法。`nominal`は名詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["verbal-phrase"]["nominal"],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "準動詞句",
                        description: "任意の準動詞句。",
                      }),
                    z
                      .object({
                        kind: z.literal("sentence-constituent").meta({
                          title: "区分",
                          description:
                            "文構造要素の区分。`sentence-constituent`は文の構成要素を表す。",
                        }),
                        type: z.literal("verbal-phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`verbal-phrase`は準動詞句を表す。",
                        }),
                        usage: z.literal("adjectival").meta({
                          title: "用法",
                          description:
                            "文中での用法。`adjectival`は形容詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["verbal-phrase"]["adjectival"],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "準動詞句",
                        description: "任意の準動詞句。",
                      }),
                    z
                      .object({
                        kind: z.literal("sentence-constituent").meta({
                          title: "区分",
                          description:
                            "文構造要素の区分。`sentence-constituent`は文の構成要素を表す。",
                        }),
                        type: z.literal("verbal-phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`verbal-phrase`は準動詞句を表す。",
                        }),
                        usage: z.literal("adverbial").meta({
                          title: "用法",
                          description:
                            "文中での用法。`adverbial`は副詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["verbal-phrase"]["adverbial"],
                            ),
                          )
                          .meta({
                            title: "文の要素名",
                            description: "文の要素の名前。",
                          }),
                      })
                      .meta({
                        title: "準動詞句",
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
                        usage: z.literal("nominal").meta({
                          title: "用法",
                          description:
                            "文中での用法。`nominal`は名詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["clause"]["nominal"],
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
                        type: z.literal("clause").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`clause`は節を表す。",
                        }),
                        usage: z.literal("adjectival").meta({
                          title: "用法",
                          description:
                            "文中での用法。`adjectival`は形容詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["clause"]["adjectival"],
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
                        type: z.literal("clause").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`clause`は節を表す。",
                        }),
                        usage: z.literal("adverbial").meta({
                          title: "用法",
                          description:
                            "文中での用法。`adverbial`は副詞的用法を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["clause"]["adverbial"],
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
                        type: z.literal("modifier-phrase").meta({
                          title: "種別",
                          description:
                            "文の構成要素の種別。`modifier-phrase`は修飾語句を表す。",
                        }),
                        index: z.int().nonnegative().meta({
                          title: "インデックス",
                          description:
                            "文構造要素を一意に識別するためのインデックス。",
                        }),
                        text: z.string().meta({
                          title: "テキスト",
                          description:
                            "この文構造要素に対応する文中のテキスト。",
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
                              allowedSentenceElementNameOptions[
                                "sentence-constituent"
                              ]["modifier-phrase"],
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
                    description:
                      "準動詞句、節、修飾語句のいずれかからなる構造要素。",
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
                    text: z.string().meta({
                      title: "テキスト",
                      description: "この文構造要素に対応する文中のテキスト。",
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
                modifierSentenceStructureElementText: z.string().meta({
                  title: "修飾要素テキスト",
                  description: "修飾関係の修飾要素となる文構造要素のテキスト。",
                }),
                modifierSentenceStructureElementIndex: z
                  .int()
                  .nonnegative()
                  .meta({
                    title: "修飾要素インデックス",
                    description:
                      "修飾関係の修飾要素となる文構造要素のインデックス。",
                  }),
                modifiedSentenceStructureElementText: z.string().meta({
                  title: "被修飾要素テキスト",
                  description:
                    "修飾関係の被修飾要素となる文構造要素のテキスト。",
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
                      text: z.string().meta({
                        title: "テキスト",
                        description:
                          "この並列関係の構成要素に対応する文中のテキスト。",
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
        }),
    ),
  })
  .meta({
    title: "英文構造に関する情報",
    description: "英文構造図が共通して内部的に持つ英文構造に関する情報。",
  });
type SentenceStructureAnnotationsOutput = z.infer<
  typeof SentenceStructureAnnotationsOutputSchema
>;

function createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutput(
  wordSentences: { words: Word[] }[],
  sentenceStructureAnnotationsOutput: SentenceStructureAnnotationsOutput,
): SentenceStructureDocument {
  const simplifiedSentenceStructureDocument: SimplifiedSentenceStructureDocument =
    {
      sentences: wordSentences.map((wordSentence, wordSentenceIndex) => ({
        words: wordSentence.words,
        sentenceStructureElements:
          sentenceStructureAnnotationsOutput.sentences[wordSentenceIndex]!
            .sentenceStructureElements,
        modifications:
          sentenceStructureAnnotationsOutput.sentences[wordSentenceIndex]!
            .modifications,
        coordinations:
          sentenceStructureAnnotationsOutput.sentences[wordSentenceIndex]!
            .coordinations,
      })),
    };
  return createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
    simplifiedSentenceStructureDocument,
  );
}

export function createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutputJSONString(
  wordSentences: { words: Word[] }[],
  sentenceStructureAnnotationsOutputJSONString: string,
): SentenceStructureDocument {
  const sentenceStructureAnnotationsOutput =
    SentenceStructureAnnotationsOutputSchema.parse(
      JSON.parse(sentenceStructureAnnotationsOutputJSONString),
    );
  return createSentenceStructureDocumentFromWordsAndSentenceStructureAnnotationsOutput(
    wordSentences,
    sentenceStructureAnnotationsOutput,
  );
}

function sentenceStructureDocumentToSentenceStructureAnnotationsOutput(
  sentenceStructureDocument: SentenceStructureDocument,
): SentenceStructureAnnotationsOutput {
  const simplifiedSentenceStructureDocument =
    sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
      sentenceStructureDocument,
    );

  return SentenceStructureAnnotationsOutputSchema.parse({
    sentences: simplifiedSentenceStructureDocument.sentences.map((sentence) => {
      const getText = (startWordIndex: number, endWordIndex: number) =>
        sentence.words
          .slice(startWordIndex, endWordIndex + 1)
          .map(
            (word, wordIndex, words) =>
              word.text +
              (wordIndex < words.length - 1 ? word.whitespaceAfter : ""),
          )
          .join("");

      const sentenceStructureElements = sentence.sentenceStructureElements.map(
        (sentenceStructureElement) => {
          switch (sentenceStructureElement.kind) {
            case "core-sentence-element": {
              return {
                kind: "core-sentence-element",
                index: sentenceStructureElement.index,
                text: getText(
                  sentenceStructureElement.startWordIndex,
                  sentenceStructureElement.endWordIndex,
                ),
                startWordIndex: sentenceStructureElement.startWordIndex,
                endWordIndex: sentenceStructureElement.endWordIndex,
                sentenceElementName:
                  sentenceStructureElement.sentenceElementName,
              } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
            }
            case "sentence-constituent": {
              switch (sentenceStructureElement.type) {
                case "verbal-phrase": {
                  switch (sentenceStructureElement.usage) {
                    case "nominal": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    case "adjectival": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    case "adverbial": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    default: {
                      sentenceStructureElement satisfies never;
                      throw new Error("Unreachable");
                    }
                  }
                }
                case "clause": {
                  switch (sentenceStructureElement.usage) {
                    case "nominal": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    case "adjectival": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    case "adverbial": {
                      return {
                        kind: "sentence-constituent",
                        type: sentenceStructureElement.type,
                        usage: sentenceStructureElement.usage,
                        index: sentenceStructureElement.index,
                        text: getText(
                          sentenceStructureElement.startWordIndex,
                          sentenceStructureElement.endWordIndex,
                        ),
                        startWordIndex: sentenceStructureElement.startWordIndex,
                        endWordIndex: sentenceStructureElement.endWordIndex,
                        sentenceElementName:
                          sentenceStructureElement.sentenceElementName,
                      } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                    }
                    default: {
                      sentenceStructureElement satisfies never;
                      throw new Error("Unreachable");
                    }
                  }
                }
                case "modifier-phrase": {
                  return {
                    kind: "sentence-constituent",
                    type: sentenceStructureElement.type,
                    index: sentenceStructureElement.index,
                    text: getText(
                      sentenceStructureElement.startWordIndex,
                      sentenceStructureElement.endWordIndex,
                    ),
                    startWordIndex: sentenceStructureElement.startWordIndex,
                    endWordIndex: sentenceStructureElement.endWordIndex,
                    sentenceElementName:
                      sentenceStructureElement.sentenceElementName,
                  } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
                }
                default: {
                  sentenceStructureElement satisfies never;
                  throw new Error("Unreachable");
                }
              }
            }
            case "modification-element": {
              return {
                kind: "modification-element",
                index: sentenceStructureElement.index,
                text: getText(
                  sentenceStructureElement.startWordIndex,
                  sentenceStructureElement.endWordIndex,
                ),
                startWordIndex: sentenceStructureElement.startWordIndex,
                endWordIndex: sentenceStructureElement.endWordIndex,
              } satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"][number];
            }
            default: {
              sentenceStructureElement satisfies never;
              throw new Error("Unreachable");
            }
          }
        },
      ) satisfies SentenceStructureAnnotationsOutput["sentences"][number]["sentenceStructureElements"];

      return {
        sentenceStructureElements,
        modifications: sentence.modifications.map((modification) => ({
          modifierSentenceStructureElementText:
            sentenceStructureElements[
              modification.modifierSentenceStructureElementIndex
            ]!.text,
          modifierSentenceStructureElementIndex:
            modification.modifierSentenceStructureElementIndex,
          modifiedSentenceStructureElementText:
            sentenceStructureElements[
              modification.modifiedSentenceStructureElementIndex
            ]!.text,
          modifiedSentenceStructureElementIndex:
            modification.modifiedSentenceStructureElementIndex,
        })) satisfies SentenceStructureAnnotationsOutput["sentences"][number]["modifications"],
        coordinations: sentence.coordinations.map((coordination) => ({
          parts: coordination.parts.map((part) => ({
            type: part.type,
            text: getText(part.startWordIndex, part.endWordIndex),
            startWordIndex: part.startWordIndex,
            endWordIndex: part.endWordIndex,
          })),
        })) satisfies SentenceStructureAnnotationsOutput["sentences"][number]["coordinations"],
      };
    }),
  } satisfies SentenceStructureAnnotationsOutput);
}

export function sentenceStructureDocumentToSentenceStructureAnnotationsOutputJSONString(
  sentenceStructureDocument: SentenceStructureDocument,
): string {
  const sentenceStructureAnnotationsOutput =
    sentenceStructureDocumentToSentenceStructureAnnotationsOutput(
      sentenceStructureDocument,
    );
  return JSON.stringify(sentenceStructureAnnotationsOutput, null, 2);
}
