import * as z from "zod";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import {
  sentenceElementRangeTypeOptions,
  SentenceStructureDataSchema,
  type Coordination,
  type CoordinationChildType,
  type Range,
  type Relation,
  type SentenceElementRangeType,
  type SentenceStructureRangeType,
} from "./schema.js";
import {
  SimplifiedSentenceStructureDataSchema,
  type SimplifiedSentenceStructureData,
} from "./simplified-schema.js";

const sentenceElementRangeTypePairs = [
  ["core-sentence-element", "文の主要素"],
] as const satisfies [SentenceElementRangeType, string][];
const sentenceElementRangeTypeToSimplifiedSentenceElementRangeTypeMap = new Map(
  sentenceElementRangeTypePairs,
);
const simplifiedSentenceElementRangeTypeToSentenceElementRangeTypeMap = new Map(
  sentenceElementRangeTypePairs.map(([a, b]) => [b, a]),
);

const sentenceStructureRangeTypePairs = [
  ["modifier", "修飾語"],
  ["phrase", "句"],
  ["clause", "節"],
] as const satisfies [SentenceStructureRangeType, string][];
const sentenceStructureRangeTypeToSimplifiedSentenceStructureRangeTypeMap =
  new Map(sentenceStructureRangeTypePairs);
const simplifiedSentenceStructureRangeTypeToSentenceStructureRangeTypeMap =
  new Map(sentenceStructureRangeTypePairs.map(([a, b]) => [b, a]));

const coordinationChildTypePairs = [
  ["coordinating conjunction", "等位接続詞"],
  ["correlative conjunction", "相関接続詞"],
  ["conjunct", "並列要素"],
] as const satisfies [CoordinationChildType, string][];
const coordinationChildTypeToSimplifiedCoordinationChildTypeMap = new Map(
  coordinationChildTypePairs,
);
const simplifiedCoordinationChildTypeToCoordinationChildTypeMap = new Map(
  coordinationChildTypePairs.map(([a, b]) => [b, a]),
);

export const simplifiedSentenceStructureDataToSentenceStructureData = z.codec(
  SimplifiedSentenceStructureDataSchema,
  SentenceStructureDataSchema,
  {
    decode: (simplifiedSentenceStructureData) => {
      const sortedSimplifiedSentenceStructureData = {
        text: simplifiedSentenceStructureData.text,
        words: simplifiedSentenceStructureData.words.sort(
          (a, b) => a.index - b.index,
        ),
        ranges: simplifiedSentenceStructureData.ranges.sort(
          (a, b) => a.index - b.index,
        ),
        relations: simplifiedSentenceStructureData.relations,
        coordinations: simplifiedSentenceStructureData.coordinations.map(
          (coordination) => ({
            children: coordination.children.sort(
              (a, b) => a.startWordIndex - b.startWordIndex,
            ),
          }),
        ),
      };
      const rangeIds = sortedSimplifiedSentenceStructureData.ranges.map(() =>
        crypto.randomUUID(),
      );

      return {
        text: sortedSimplifiedSentenceStructureData.text,
        words: sortedSimplifiedSentenceStructureData.words,
        ranges: sortedSimplifiedSentenceStructureData.ranges.map((range) =>
          range.type === "関係"
            ? {
                kind: "relation",
                type: "relation",
                id: rangeIds[range.index]!,
                startWordIndex: range.startWordIndex,
                endWordIndex: range.endWordIndex,
              }
            : sentenceElementRangeTypeOptions.includes(
                  simplifiedSentenceElementRangeTypeToSentenceElementRangeTypeMap.get(
                    range.type as any,
                  )!,
                )
              ? {
                  kind: "core-sentence-element",
                  type: simplifiedSentenceElementRangeTypeToSentenceElementRangeTypeMap.get(
                    range.type as any,
                  )!,
                  id: rangeIds[range.index]!,
                  startWordIndex: range.startWordIndex,
                  endWordIndex: range.endWordIndex,
                  sentenceElementName: range.sentenceElementName,
                }
              : {
                  kind: "sentence-structure",
                  type: simplifiedSentenceStructureRangeTypeToSentenceStructureRangeTypeMap.get(
                    range.type as any,
                  )!,
                  id: rangeIds[range.index]!,
                  startWordIndex: range.startWordIndex,
                  endWordIndex: range.endWordIndex,
                  sentenceElementName: range.sentenceElementName,
                },
        ) as Range[],
        relations: sortedSimplifiedSentenceStructureData.relations.map(
          (relation) => {
            return {
              id: crypto.randomUUID(),
              fromRangeId: rangeIds[relation.fromRangeIndex]!,
              toRangeId: rangeIds[relation.toRangeIndex]!,
            };
          },
        ) satisfies Relation[],
        coordinations: sortedSimplifiedSentenceStructureData.coordinations.map(
          (coordination) => ({
            id: crypto.randomUUID(),
            children: coordination.children.map((child, index) => ({
              type: simplifiedCoordinationChildTypeToCoordinationChildTypeMap.get(
                child.type,
              )!,
              index: index,
              startWordIndex: child.startWordIndex,
              endWordIndex: child.endWordIndex,
            })),
          }),
        ) satisfies Coordination[],
      };
    },
    encode: (sentenceStructureData) => {
      const sortedSentenceStructureData = {
        ...sentenceStructureData,
        words: sentenceStructureData.words.sort((a, b) => a.index - b.index),
        ranges: sentenceStructureData.ranges.sort((a, b) => {
          if (a.startWordIndex !== b.startWordIndex) {
            return a.startWordIndex - b.startWordIndex;
          }
          return b.endWordIndex - a.endWordIndex;
        }),
        relations: sentenceStructureData.relations,
        coordinations: sentenceStructureData.coordinations
          .map((coordination) => ({
            children: coordination.children.sort((a, b) => a.index - b.index),
          }))
          .sort((a, b) => {
            if (
              a.children.at(0)!.startWordIndex !==
              b.children.at(0)!.startWordIndex
            ) {
              return (
                a.children.at(0)!.startWordIndex -
                b.children.at(0)!.startWordIndex
              );
            }
            return (
              b.children.at(-1)!.endWordIndex - a.children.at(-1)!.endWordIndex
            );
          }),
      };
      return {
        text: sortedSentenceStructureData.text,
        words: sortedSentenceStructureData.words,
        ranges: sortedSentenceStructureData.ranges.map((range, index) =>
          range.kind === "relation"
            ? {
                type: "関係",
                index: index,
                startWordIndex: range.startWordIndex,
                endWordIndex: range.endWordIndex,
              }
            : {
                type:
                  range.kind === "core-sentence-element"
                    ? sentenceElementRangeTypeToSimplifiedSentenceElementRangeTypeMap.get(
                        range.type,
                      )!
                    : sentenceStructureRangeTypeToSimplifiedSentenceStructureRangeTypeMap.get(
                        range.type,
                      )!,
                index: index,
                startWordIndex: range.startWordIndex,
                endWordIndex: range.endWordIndex,
                sentenceElementName: range.sentenceElementName,
              },
        ) as SimplifiedSentenceStructureData["ranges"],
        relations: (
          sortedSentenceStructureData.relations.map((relation) => ({
            fromRangeIndex: sortedSentenceStructureData.ranges.findIndex(
              (range) => range.id === relation.fromRangeId,
            ),
            toRangeIndex: sortedSentenceStructureData.ranges.findIndex(
              (range) => range.id === relation.toRangeId,
            ),
          })) satisfies SimplifiedSentenceStructureData["relations"]
        ).sort((a, b) => {
          if (a.fromRangeIndex !== b.fromRangeIndex) {
            return a.fromRangeIndex - b.fromRangeIndex;
          }
          return b.toRangeIndex - a.toRangeIndex;
        }),
        coordinations: sortedSentenceStructureData.coordinations.map(
          (coordination) => ({
            children: coordination.children.map((child) => ({
              type: coordinationChildTypeToSimplifiedCoordinationChildTypeMap.get(
                child.type,
              )!,
              startWordIndex: child.startWordIndex,
              endWordIndex: child.endWordIndex,
            })),
          }),
        ) satisfies SimplifiedSentenceStructureData["coordinations"],
      };
    },
  },
);

export const stringToSentenceStructureData = z.codec(
  z.string(),
  SentenceStructureDataSchema,
  {
    decode: (string) =>
      simplifiedSentenceStructureDataToSentenceStructureData.decode(
        JSON.parse(string),
      ),
    encode: (sentenceStructureData) =>
      JSON.stringify(
        simplifiedSentenceStructureDataToSentenceStructureData.encode(
          sentenceStructureData,
        ),
        null,
        2,
      ),
  },
);

export const xmlStringToSentenceStructureData = z.codec(
  z.string(),
  SentenceStructureDataSchema,
  {
    decode: (xml) => {
      const parsed = new XMLParser({
        isArray: (tagName) =>
          [
            "words",
            "ranges",
            "relations",
            "coordinations",
            "children",
          ].includes(tagName),
      }).parse(xml);
      return simplifiedSentenceStructureDataToSentenceStructureData.decode({
        words: [],
        relations: [],
        coordinations: [],
        ...parsed,
        ranges:
          parsed.ranges?.map((range: any) => ({
            ...range,
            sentenceElementName:
              range.sentenceElementName === ""
                ? null
                : range.sentenceElementName,
          })) ?? [],
      });
    },
    encode: (sentenceStructureData) =>
      new XMLBuilder({ format: true }).build(
        simplifiedSentenceStructureDataToSentenceStructureData.encode(
          sentenceStructureData,
        ),
      ),
  },
);
