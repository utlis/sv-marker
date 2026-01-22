import * as z from "zod";

const WordSchema = z.object({
  id: z.uuid(),
  index: z.int().nonnegative(),
  text: z.string(),
  whitespaceAfter: z.string(),
});
export type Word = z.infer<typeof WordSchema>;

export const sentenceElementNameOptions = ["S", "V", "O", "C", "M"] as const;
export type SentenceElementName = (typeof sentenceElementNameOptions)[number];

export const coreSentenceElementAllowedSentenceElementNameOptions = [
  "S",
  "V",
  "O",
  "C",
] as const satisfies readonly SentenceElementName[];

const sentenceConstituentTypeOptions = [
  "phrase",
  "clause",
  "adverbial-phrase",
] as const;
export type SentenceConstituentType =
  (typeof sentenceConstituentTypeOptions)[number];
export const sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap = {
  phrase: ["S", "O", "C", "M"] as const,
  clause: ["S", "O", "C", "M"] as const,
  "adverbial-phrase": ["M"] as const,
} satisfies Record<SentenceConstituentType, readonly SentenceElementName[]>;

const SentenceStructureElementSchema = z.union([
  z.object({
    kind: z.literal("core-sentence-element"),
    id: z.uuid(),
    startWordId: z.uuid(),
    endWordId: z.uuid(),
    sentenceElementName: z.nullable(
      z.literal(coreSentenceElementAllowedSentenceElementNameOptions),
    ),
  }),
  z.object({
    kind: z.literal("sentence-constituent"),
    type: z.literal("phrase"),
    usage: z.literal(["nominal", "adjectival", "adverbial"]),
    id: z.uuid(),
    startWordId: z.uuid(),
    endWordId: z.uuid(),
    sentenceElementName: z.nullable(
      z.literal(
        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap["phrase"],
      ),
    ),
  }),
  z.object({
    kind: z.literal("sentence-constituent"),
    type: z.literal("clause"),
    usage: z.literal(["nominal", "adjectival", "adverbial"]),
    id: z.uuid(),
    startWordId: z.uuid(),
    endWordId: z.uuid(),
    sentenceElementName: z.nullable(
      z.literal(
        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap["clause"],
      ),
    ),
  }),
  z.object({
    kind: z.literal("sentence-constituent"),
    type: z.literal("adverbial-phrase"),
    id: z.uuid(),
    startWordId: z.uuid(),
    endWordId: z.uuid(),
    sentenceElementName: z.nullable(
      z.literal(
        sentenceConstituentTypeToAllowedSentenceElementNameOptionsMap[
          "adverbial-phrase"
        ],
      ),
    ),
  }),
  z.object({
    kind: z.literal("modification-element"),
    id: z.uuid(),
    startWordId: z.uuid(),
    endWordId: z.uuid(),
  }),
]);
export type SentenceStructureElement = z.infer<
  typeof SentenceStructureElementSchema
>;

const ModificationSchema = z.object({
  id: z.uuid(),
  modifierSentenceStructureElementId: z.uuid(),
  modifiedSentenceStructureElementId: z.uuid(),
});
export type Modification = z.infer<typeof ModificationSchema>;

const coordinationPartTypeOptions = [
  "coordinator",
  "correlative",
  "conjunct",
] as const;
export type CoordinationPartType = (typeof coordinationPartTypeOptions)[number];

const CoordinationPartSchema = z.object({
  type: z.literal(coordinationPartTypeOptions),
  id: z.uuid(),
  index: z.int().nonnegative(),
  startWordId: z.uuid(),
  endWordId: z.uuid(),
});
export type CoordinationPart = z.infer<typeof CoordinationPartSchema>;

const CoordinationSchema = z.object({
  id: z.uuid(),
  parts: z.array(CoordinationPartSchema),
});
export type Coordination = z.infer<typeof CoordinationSchema>;

const SentenceSchema = z
  .object({
    id: z.uuid(),
    index: z.int().nonnegative(),
    words: z.array(WordSchema),
    sentenceStructureElements: z.array(SentenceStructureElementSchema),
    modifications: z.array(ModificationSchema),
    coordinations: z.array(CoordinationSchema),
  })
  .refine(
    (sentence) => sentence.words.every((word, index) => word.index === index),
    {
      error: "単語のインデックスが0から始まる連続した整数ではありません。",
    },
  )
  .refine(
    (sentence) =>
      sentence.sentenceStructureElements.every(
        (sentenceStructureElement) =>
          sentence.words.some(
            (word) => word.id === sentenceStructureElement.startWordId,
          ) &&
          sentence.words.some(
            (word) => word.id === sentenceStructureElement.endWordId,
          ),
      ),
    { error: "文構造要素が存在しない単語を参照しています。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.sentenceStructureElements.every(
        (sentenceStructureElement) => {
          const startWordIndex = wordIdToWordIndexMap.get(
            sentenceStructureElement.startWordId,
          )!;
          const endWordIndex = wordIdToWordIndexMap.get(
            sentenceStructureElement.endWordId,
          )!;
          return startWordIndex <= endWordIndex;
        },
      );
    },
    { error: "文構造要素の開始・終了位置が不正な値です。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.sentenceStructureElements.every(
        (sentenceStructureElement) =>
          sentence.sentenceStructureElements
            .filter(
              (otherSentenceStructureElement) =>
                otherSentenceStructureElement.id !==
                sentenceStructureElement.id,
            )
            .every((otherSentenceStructureElement) => {
              const sentenceStructureElementStartWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.startWordId)!;
              const sentenceStructureElementEndWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.endWordId)!;
              const otherSentenceStructureElementStartWordIndex =
                wordIdToWordIndexMap.get(
                  otherSentenceStructureElement.startWordId,
                )!;
              const otherSentenceStructureElementEndWordIndex =
                wordIdToWordIndexMap.get(
                  otherSentenceStructureElement.endWordId,
                )!;
              return !(
                sentenceStructureElementStartWordIndex ===
                  otherSentenceStructureElementStartWordIndex &&
                sentenceStructureElementEndWordIndex ===
                  otherSentenceStructureElementEndWordIndex
              );
            }),
      );
    },
    {
      error: "開始・終了位置が同じ文構造要素が複数存在します。",
    },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.sentenceStructureElements.every(
        (sentenceStructureElement) =>
          sentence.sentenceStructureElements
            .filter(
              (otherSentenceStructureElement) =>
                otherSentenceStructureElement.id !==
                sentenceStructureElement.id,
            )
            .every((otherSentenceStructureElement) => {
              const sentenceStructureElementStartWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.startWordId)!;
              const sentenceStructureElementEndWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.endWordId)!;
              const otherSentenceStructureElementStartWordIndex =
                wordIdToWordIndexMap.get(
                  otherSentenceStructureElement.startWordId,
                )!;
              const otherSentenceStructureElementEndWordIndex =
                wordIdToWordIndexMap.get(
                  otherSentenceStructureElement.endWordId,
                )!;
              return (
                otherSentenceStructureElementEndWordIndex <
                  sentenceStructureElementStartWordIndex ||
                (sentenceStructureElementStartWordIndex <=
                  otherSentenceStructureElementStartWordIndex &&
                  otherSentenceStructureElementEndWordIndex <=
                    sentenceStructureElementEndWordIndex) ||
                (otherSentenceStructureElementStartWordIndex <=
                  sentenceStructureElementStartWordIndex &&
                  sentenceStructureElementEndWordIndex <=
                    otherSentenceStructureElementEndWordIndex) ||
                sentenceStructureElementEndWordIndex <
                  otherSentenceStructureElementStartWordIndex
              );
            }),
      );
    },
    { error: "文構造要素が交差しています。" },
  )
  .refine(
    (sentence) =>
      sentence.sentenceStructureElements
        .filter(
          (sentenceStructureElement) =>
            sentenceStructureElement.kind === "modification-element",
        )
        .every((modificationSentenceStructureElement) =>
          sentence.modifications.some(
            (modification) =>
              modification.modifierSentenceStructureElementId ===
                modificationSentenceStructureElement.id ||
              modification.modifiedSentenceStructureElementId ===
                modificationSentenceStructureElement.id,
          ),
        ),
    {
      error:
        "修飾関係の要素が修飾関係の修飾要素・被修飾要素として参照されていません。",
    },
  )
  .refine(
    (sentence) =>
      sentence.modifications.every(
        (modification) =>
          sentence.sentenceStructureElements.some(
            (sentenceStructureElement) =>
              sentenceStructureElement.id ===
              modification.modifierSentenceStructureElementId,
          ) &&
          sentence.sentenceStructureElements.some(
            (sentenceStructureElement) =>
              sentenceStructureElement.id ===
              modification.modifiedSentenceStructureElementId,
          ),
      ),
    { error: "修飾関係が存在しない文構造要素を参照しています。" },
  )
  .refine(
    (sentence) =>
      sentence.modifications.every((modification) =>
        sentence.modifications
          .filter(
            (otherModification) => otherModification.id !== modification.id,
          )
          .every(
            (otherModification) =>
              !(
                otherModification.modifierSentenceStructureElementId ===
                  modification.modifierSentenceStructureElementId &&
                otherModification.modifiedSentenceStructureElementId ===
                  modification.modifiedSentenceStructureElementId
              ),
          ),
      ),
    {
      error: "修飾要素・被修飾要素が同じ修飾関係が複数存在します。",
    },
  )
  .refine(
    (sentence) =>
      sentence.coordinations.every(
        (coordination) => 2 <= coordination.parts.length,
      ),
    { error: "並列関係の構成要素は2つ以上必要です。" },
  )
  .refine(
    (sentence) =>
      sentence.coordinations.every((coordination) =>
        coordination.parts.every((part, index) => part.index === index),
      ),
    {
      error:
        "並列関係の構成要素のインデックスが0から始まる連続した整数ではありません。",
    },
  )
  .refine(
    (sentence) =>
      sentence.coordinations.every((coordination) =>
        coordination.parts.every(
          (part) =>
            sentence.words.some((word) => word.id === part.startWordId) &&
            sentence.words.some((word) => word.id === part.endWordId),
        ),
      ),
    { error: "並列関係の構成要素が存在しない単語を参照しています。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.coordinations.every((coordination) =>
        coordination.parts.every((part) => {
          const startWordIndex = wordIdToWordIndexMap.get(part.startWordId)!;
          const endWordIndex = wordIdToWordIndexMap.get(part.endWordId)!;
          return startWordIndex <= endWordIndex;
        }),
      );
    },
    { error: "並列関係の構成要素の開始・終了位置が不正な値です。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.coordinations.every((coordination) =>
        coordination.parts.every((part, index) => {
          if (index === 0) {
            return true;
          }

          const previousPartEndWordIndex = wordIdToWordIndexMap.get(
            coordination.parts.at(index - 1)!.endWordId,
          )!;
          const currentPartStartWordIndex = wordIdToWordIndexMap.get(
            part.startWordId,
          )!;
          return previousPartEndWordIndex + 1 === currentPartStartWordIndex;
        }),
      );
    },
    { error: "並列関係の構成要素が連続していません。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.coordinations.every((coordination) =>
        coordination.parts.every((part) =>
          sentence.sentenceStructureElements.every(
            (sentenceStructureElement) => {
              const sentenceStructureElementStartWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.startWordId)!;
              const sentenceStructureElementEndWordIndex =
                wordIdToWordIndexMap.get(sentenceStructureElement.endWordId)!;
              const partStartWordIndex = wordIdToWordIndexMap.get(
                part.startWordId,
              )!;
              const partEndWordIndex = wordIdToWordIndexMap.get(
                part.endWordId,
              )!;
              return (
                sentenceStructureElementEndWordIndex < partStartWordIndex ||
                (partStartWordIndex <= sentenceStructureElementStartWordIndex &&
                  sentenceStructureElementEndWordIndex <= partEndWordIndex) ||
                (sentenceStructureElementStartWordIndex <= partStartWordIndex &&
                  partEndWordIndex <= sentenceStructureElementEndWordIndex) ||
                partEndWordIndex < sentenceStructureElementStartWordIndex
              );
            },
          ),
        ),
      );
    },
    { error: "並列関係の構成要素が文構造要素と交差しています。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.coordinations.every((coordination) =>
        sentence.coordinations
          .filter(
            (otherCoordination) => otherCoordination.id !== coordination.id,
          )
          .every((otherCoordination) => {
            const coordinationStartWordIndex = wordIdToWordIndexMap.get(
              coordination.parts.at(0)!.startWordId,
            )!;
            const coordinationEndWordIndex = wordIdToWordIndexMap.get(
              coordination.parts.at(-1)!.endWordId,
            )!;
            const otherCoordinationStartWordIndex = wordIdToWordIndexMap.get(
              otherCoordination.parts.at(0)!.startWordId,
            )!;
            const otherCoordinationEndWordIndex = wordIdToWordIndexMap.get(
              otherCoordination.parts.at(-1)!.endWordId,
            )!;
            return !(
              otherCoordinationStartWordIndex === coordinationStartWordIndex &&
              otherCoordinationEndWordIndex === coordinationEndWordIndex
            );
          }),
      );
    },
    { error: "開始・終了位置が同じ並列関係が複数存在します。" },
  )
  .refine(
    (sentence) => {
      const wordIdToWordIndexMap = new Map(
        sentence.words.map((word) => [word.id, word.index]),
      );
      return sentence.coordinations.every((coordination) =>
        sentence.coordinations
          .filter(
            (otherCoordination) => otherCoordination.id !== coordination.id,
          )
          .every((otherCoordination) => {
            const coordinationStartWordIndex = wordIdToWordIndexMap.get(
              coordination.parts.at(0)!.startWordId,
            )!;
            const coordinationEndWordIndex = wordIdToWordIndexMap.get(
              coordination.parts.at(-1)!.endWordId,
            )!;
            const otherCoordinationStartWordIndex = wordIdToWordIndexMap.get(
              otherCoordination.parts.at(0)!.startWordId,
            )!;
            const otherCoordinationEndWordIndex = wordIdToWordIndexMap.get(
              otherCoordination.parts.at(-1)!.endWordId,
            )!;
            return (
              otherCoordinationEndWordIndex < coordinationStartWordIndex ||
              coordination.parts.some(
                (part) =>
                  wordIdToWordIndexMap.get(part.startWordId)! <=
                    otherCoordinationStartWordIndex &&
                  otherCoordinationEndWordIndex <=
                    wordIdToWordIndexMap.get(part.endWordId)!,
              ) ||
              otherCoordination.parts.some(
                (part) =>
                  wordIdToWordIndexMap.get(part.startWordId)! <=
                    coordinationStartWordIndex &&
                  coordinationEndWordIndex <=
                    wordIdToWordIndexMap.get(part.endWordId)!,
              ) ||
              coordinationEndWordIndex < otherCoordinationStartWordIndex
            );
          }),
      );
    },
    { error: "並列関係が交差しています。" },
  );
export type Sentence = z.infer<typeof SentenceSchema>;

export const SentenceStructureDocumentSchema = z.object({
  sentences: z.array(SentenceSchema),
});
export type SentenceStructureDocument = z.infer<
  typeof SentenceStructureDocumentSchema
>;
