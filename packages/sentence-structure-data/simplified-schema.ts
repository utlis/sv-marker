import * as z from "zod";
import {
  sentenceElementRangeTypeOptions,
  sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap,
  sentenceStructureRangeTypeOptions,
  sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap,
} from "./schema.js";

export const SimplifiedAnnotationDataSchema = z.object({
  ranges: z.array(
    z
      .union([
        ...sentenceElementRangeTypeOptions.map(
          (sentenceElementRangeTypeOption) =>
            ({
              "core-sentence-element": z
                .object({
                  type: z.literal("文の主要素").describe("範囲の種類"),
                  index: z
                    .int()
                    .nonnegative()
                    .describe("範囲を識別するためのインデックス"),
                  startWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる先頭の単語のインデックス"),
                  endWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる末尾の単語のインデックス"),
                  sentenceElementName: z
                    .nullable(
                      z.literal(
                        sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap[
                          "core-sentence-element"
                        ],
                      ),
                    )
                    .describe("文の要素の名前"),
                })
                .describe("文の主要素の範囲"),
            })[sentenceElementRangeTypeOption],
        ),
        ...sentenceStructureRangeTypeOptions.map(
          (sentenceStructureRangeTypeOption) =>
            ({
              modifier: z
                .object({
                  type: z.literal("修飾語").describe("範囲の種類"),
                  index: z
                    .int()
                    .nonnegative()
                    .describe("範囲を識別するためのインデックス"),
                  startWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる先頭の単語のインデックス"),
                  endWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる末尾の単語のインデックス"),
                  sentenceElementName: z
                    .nullable(
                      z.literal(
                        sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                          "modifier"
                        ],
                      ),
                    )
                    .describe("文の要素の名前"),
                })
                .describe("修飾語の範囲"),
              phrase: z
                .object({
                  type: z.literal("句").describe("範囲の種類"),
                  index: z
                    .int()
                    .nonnegative()
                    .describe("範囲を識別するためのインデックス"),
                  startWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる先頭の単語のインデックス"),
                  endWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる末尾の単語のインデックス"),
                  sentenceElementName: z
                    .nullable(
                      z.literal(
                        sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                          "phrase"
                        ],
                      ),
                    )
                    .describe("文の要素の名前"),
                })
                .describe("句の範囲"),
              clause: z
                .object({
                  type: z.literal("節").describe("範囲の種類"),
                  index: z
                    .int()
                    .nonnegative()
                    .describe("範囲を識別するためのインデックス"),
                  startWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる先頭の単語のインデックス"),
                  endWordIndex: z
                    .int()
                    .nonnegative()
                    .describe("範囲に含まれる末尾の単語のインデックス"),
                  sentenceElementName: z
                    .nullable(
                      z.literal(
                        sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                          "clause"
                        ],
                      ),
                    )
                    .describe("文の要素の名前"),
                })
                .describe("節の範囲"),
            })[sentenceStructureRangeTypeOption],
        ),
        z
          .object({
            type: z.literal("関係").describe("範囲の種類"),
            index: z
              .int()
              .nonnegative()
              .describe("範囲を識別するためのインデックス"),
            startWordIndex: z
              .int()
              .nonnegative()
              .describe("範囲に含まれる先頭の単語のインデックス"),
            endWordIndex: z
              .int()
              .nonnegative()
              .describe("範囲に含まれる末尾の単語のインデックス"),
          })
          .describe("関係の範囲"),
      ])
      .describe("範囲"),
  ),
  relations: z.array(
    z
      .object({
        fromRangeIndex: z
          .int()
          .nonnegative()
          .describe("関係の始点となる範囲のインデックス"),
        toRangeIndex: z
          .int()
          .nonnegative()
          .describe("関係の終点となる範囲のインデックス"),
      })
      .describe("関係"),
  ),
  coordinations: z.array(
    z
      .object({
        children: z.array(
          z
            .object({
              type: z
                .literal(["等位接続詞", "相関接続詞", "並列要素"])
                .describe("子要素の種類"),
              startWordIndex: z
                .int()
                .nonnegative()
                .describe("子要素に含まれる先頭の単語のインデックス"),
              endWordIndex: z
                .int()
                .nonnegative()
                .describe("子要素に含まれる末尾の単語のインデックス"),
            })
            .describe("子要素"),
        ),
      })
      .describe("並列構造"),
  ),
});
export type SimplifiedAnnotationData = z.infer<
  typeof SimplifiedAnnotationDataSchema
>;

export const SimplifiedSentenceStructureDataSchema =
  SimplifiedAnnotationDataSchema.extend({
    text: z.string(),
    words: z.array(
      z.object({
        index: z.int().nonnegative(),
        text: z.string(),
      }),
    ),
  })
    .refine(
      (simplifiedSentenceStructureData) =>
        simplifiedSentenceStructureData.ranges
          .sort((a, b) => a.index - b.index)
          .every((range, index) => range.index === index),
      { error: "範囲のインデックスが0から始まる連続した整数ではありません。" },
    )
    .refine(
      (simplifiedSentenceStructureData) =>
        simplifiedSentenceStructureData.relations.every(
          (relation) =>
            relation.fromRangeIndex <
              simplifiedSentenceStructureData.ranges.length &&
            relation.toRangeIndex <
              simplifiedSentenceStructureData.ranges.length,
        ),
      { error: "関係が存在しない範囲を参照しています。" },
    );
export type SimplifiedSentenceStructureData = z.infer<
  typeof SimplifiedSentenceStructureDataSchema
>;
