import * as z from "zod";

const WordSchema = z.object({
  index: z.int().nonnegative(),
  text: z.string(),
});
export type Word = z.infer<typeof WordSchema>;

export const sentenceElementNameOptions = ["S", "V", "O", "C", "M"] as const;
export type SentenceElementName = (typeof sentenceElementNameOptions)[number];

export const sentenceElementRangeTypeOptions = [
  "core-sentence-element",
] as const;
export type SentenceElementRangeType =
  (typeof sentenceElementRangeTypeOptions)[number];
export const sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap = {
  "core-sentence-element": ["S", "V", "O", "C"] as const,
} satisfies Record<SentenceElementRangeType, SentenceElementName[]>;

export const sentenceStructureRangeTypeOptions = [
  "modifier",
  "phrase",
  "clause",
] as const;
export type SentenceStructureRangeType =
  (typeof sentenceStructureRangeTypeOptions)[number];
export const sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap =
  {
    modifier: ["M"] as const,
    phrase: ["S", "O", "C", "M"] as const,
    clause: ["S", "O", "C", "M"] as const,
  } satisfies Record<SentenceStructureRangeType, SentenceElementName[]>;

const relationRangeTypeOption = "relation" as const;
export type RelationRangeType = typeof relationRangeTypeOption;

export type RangeType =
  | SentenceElementRangeType
  | SentenceStructureRangeType
  | RelationRangeType;

const RangeSchema = z.union([
  ...sentenceElementRangeTypeOptions.map(
    (sentenceElementRangeTypeOption) =>
      ({
        "core-sentence-element": z.object({
          kind: z.literal("sentence-element"),
          type: z.literal("core-sentence-element"),
          id: z.uuid(),
          startWordIndex: z.int().nonnegative(),
          endWordIndex: z.int().nonnegative(),
          sentenceElementName: z.nullable(
            z.literal(
              sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap[
                "core-sentence-element"
              ],
            ),
          ),
        }),
      })[sentenceElementRangeTypeOption],
  ),
  ...sentenceStructureRangeTypeOptions.map(
    (sentenceStructureRangeTypeOption) =>
      ({
        modifier: z.object({
          kind: z.literal("sentence-structure"),
          type: z.literal("modifier"),
          id: z.uuid(),
          startWordIndex: z.int().nonnegative(),
          endWordIndex: z.int().nonnegative(),
          sentenceElementName: z.nullable(
            z.literal(
              sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                "modifier"
              ],
            ),
          ),
        }),
        phrase: z.object({
          kind: z.literal("sentence-structure"),
          type: z.literal("phrase"),
          id: z.uuid(),
          startWordIndex: z.int().nonnegative(),
          endWordIndex: z.int().nonnegative(),
          sentenceElementName: z.nullable(
            z.literal(
              sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                "phrase"
              ],
            ),
          ),
        }),
        clause: z.object({
          kind: z.literal("sentence-structure"),
          type: z.literal("clause"),
          id: z.uuid(),
          startWordIndex: z.int().nonnegative(),
          endWordIndex: z.int().nonnegative(),
          sentenceElementName: z.nullable(
            z.literal(
              sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                "clause"
              ],
            ),
          ),
        }),
      })[sentenceStructureRangeTypeOption],
  ),
  z.object({
    kind: z.literal(relationRangeTypeOption),
    type: z.literal("relation"),
    id: z.uuid(),
    startWordIndex: z.int().nonnegative(),
    endWordIndex: z.int().nonnegative(),
  }),
]);
export type Range = z.infer<typeof RangeSchema>;

const RelationSchema = z.object({
  id: z.uuid(),
  fromRangeId: z.uuid(),
  toRangeId: z.uuid(),
});
export type Relation = z.infer<typeof RelationSchema>;

export const coordinationChildTypeOptions = [
  "coordinating conjunction",
  "correlative conjunction",
  "conjunct",
] as const;
export type CoordinationChildType =
  (typeof coordinationChildTypeOptions)[number];

const CoordinationChildSchema = z.object({
  type: z.literal(coordinationChildTypeOptions),
  index: z.int().nonnegative(),
  startWordIndex: z.int().nonnegative(),
  endWordIndex: z.int().nonnegative(),
});
export type CoordinationChild = z.infer<typeof CoordinationChildSchema>;

const CoordinationSchema = z.object({
  id: z.uuid(),
  children: z.array(CoordinationChildSchema),
});
export type Coordination = z.infer<typeof CoordinationSchema>;

export const SentenceStructureDataSchema = z
  .object({
    text: z.string(),
    words: z.array(WordSchema),
    ranges: z.array(RangeSchema),
    relations: z.array(RelationSchema),
    coordinations: z.array(CoordinationSchema),
  })
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.words.every((word, index) => word.index === index),
    { error: "単語のインデックスが0から始まる連続した整数ではありません。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.ranges.every(
        (range) =>
          range.startWordIndex <= range.endWordIndex &&
          range.endWordIndex < sentenceStructureData.words.length,
      ),
    { error: "範囲を示す単語のインデックスが不正な値です。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.ranges.every((range) =>
        sentenceStructureData.ranges.every(
          (otherRange) =>
            !(
              range.id !== otherRange.id &&
              range.startWordIndex === otherRange.startWordIndex &&
              range.endWordIndex === otherRange.endWordIndex
            ),
        ),
      ),
    {
      error: "開始位置と終了位置が同じ範囲が複数存在します。",
    },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.ranges.every((range) =>
        sentenceStructureData.ranges.every(
          (otherRange) =>
            range.id === otherRange.id ||
            otherRange.endWordIndex < range.startWordIndex ||
            (range.startWordIndex <= otherRange.startWordIndex &&
              otherRange.endWordIndex <= range.endWordIndex) ||
            (otherRange.startWordIndex <= range.startWordIndex &&
              range.endWordIndex <= otherRange.endWordIndex) ||
            range.endWordIndex < otherRange.startWordIndex,
        ),
      ),
    { error: "範囲が部分的に重なっています。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.ranges
        .filter((range) => range.kind === "relation")
        .every((relationRange) =>
          sentenceStructureData.relations.some(
            (relation) =>
              relation.fromRangeId === relationRange.id ||
              relation.toRangeId === relationRange.id,
          ),
        ),
    { error: "範囲（関係）が関係の始点または終点として使われていません。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.relations.every(
        (relation) =>
          sentenceStructureData.ranges.some(
            (range) => range.id === relation.fromRangeId,
          ) &&
          sentenceStructureData.ranges.some(
            (range) => range.id === relation.toRangeId,
          ),
      ),
    { error: "関係が存在しない範囲を参照しています。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.relations.every((relation) =>
        sentenceStructureData.relations.every(
          (otherRelation) =>
            !(
              relation.id !== otherRelation.id &&
              relation.fromRangeId === otherRelation.fromRangeId &&
              relation.toRangeId === otherRelation.toRangeId
            ),
        ),
      ),
    {
      error: "同じ始点と終点を持つ関係が複数存在します。",
    },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) =>
        coordination.children.every((child, index) => child.index === index),
      ),
    {
      error:
        "並列構造の子要素のインデックスが0から始まる連続した整数ではありません。",
    },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every(
        (coordination) => 3 <= coordination.children.length,
      ),
    { error: "並列構造の子要素は3つ以上必要です。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) =>
        coordination.children.every(
          (child) =>
            child.startWordIndex <= child.endWordIndex &&
            child.endWordIndex < sentenceStructureData.words.length,
        ),
      ),
    { error: "並列構造の子要素の単語のインデックスが不正な値です。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) => {
        for (let i = 1; i < coordination.children.length; i++) {
          if (
            coordination.children[i - 1]!.endWordIndex + 1 !==
            coordination.children[i]!.startWordIndex
          ) {
            return false;
          }
        }
        return true;
      }),
    { error: "並列構造の子要素が連続していません。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) =>
        coordination.children.every((child) =>
          sentenceStructureData.ranges.every(
            (range) =>
              range.endWordIndex < child.startWordIndex ||
              (child.startWordIndex <= range.startWordIndex &&
                range.endWordIndex <= child.endWordIndex) ||
              (range.startWordIndex <= child.startWordIndex &&
                child.endWordIndex <= range.endWordIndex) ||
              child.endWordIndex < range.startWordIndex,
          ),
        ),
      ),
    { error: "並列構造の子要素が範囲と部分的に重なっています。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) =>
        sentenceStructureData.coordinations.every((otherCoordination) => {
          if (coordination.id === otherCoordination.id) return true;
          const coordinationStart = coordination.children.at(0)!.startWordIndex;
          const coordinationEnd = coordination.children.at(-1)!.endWordIndex;
          const otherCoordinationStart =
            otherCoordination.children.at(0)!.startWordIndex;
          const otherCoordinationEnd =
            otherCoordination.children.at(-1)!.endWordIndex;
          return !(
            coordinationStart === otherCoordinationStart &&
            coordinationEnd === otherCoordinationEnd
          );
        }),
      ),
    { error: "開始位置と終了位置が同じ並列構造が複数存在します。" },
  )
  .refine(
    (sentenceStructureData) =>
      sentenceStructureData.coordinations.every((coordination) =>
        sentenceStructureData.coordinations.every((otherCoordination) => {
          if (coordination.id === otherCoordination.id) return true;
          const coordinationStart = coordination.children.at(0)!.startWordIndex;
          const coordinationEnd = coordination.children.at(-1)!.endWordIndex;
          const otherCoordinationStart =
            otherCoordination.children.at(0)!.startWordIndex;
          const otherCoordinationEnd =
            otherCoordination.children.at(-1)!.endWordIndex;
          if (
            coordinationEnd - coordinationStart <
            otherCoordinationEnd - otherCoordinationStart
          )
            return true;
          return (
            otherCoordinationEnd < coordinationStart ||
            coordination.children.some(
              (child) =>
                child.startWordIndex <= otherCoordinationStart &&
                otherCoordinationEnd <= child.endWordIndex,
            ) ||
            coordinationEnd < otherCoordinationStart
          );
        }),
      ),
    { error: "並列構造が部分的に重なっています。" },
  );
export type SentenceStructureData = z.infer<typeof SentenceStructureDataSchema>;
