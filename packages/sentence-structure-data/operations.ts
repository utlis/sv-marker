import {
  sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap,
  SentenceStructureDataSchema,
  sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap,
  type Coordination,
  type CoordinationChildType,
  type Range,
  type Relation,
  type SentenceElementRangeType,
  type SentenceStructureData,
  type SentenceStructureRangeType,
} from "./schema.js";
import {
  simplifiedSentenceStructureDataToSentenceStructureData,
  stringToSentenceStructureData,
  xmlStringToSentenceStructureData,
} from "./format.js";
import { tokenizeText } from "./tokenize-text.js";
import type {
  SimplifiedAnnotationData,
  SimplifiedSentenceStructureData,
} from "./simplified-schema.js";

type Result<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      message: string;
    };

export function createSentenceStructureDataFromText(input: {
  text: string;
}): SentenceStructureData {
  return SentenceStructureDataSchema.parse({
    text: input.text,
    words: tokenizeText(input.text),
    ranges: [],
    relations: [],
    coordinations: [],
  } satisfies SentenceStructureData);
}

export function createSentenceStructureDataFromStringData(
  string: string,
): Result<{ newSentenceStructureData: SentenceStructureData }> {
  const newSentenceStructureData =
    stringToSentenceStructureData.safeDecode(string);

  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function createSentenceStructureDataFromXMLData(
  xmlString: string,
): Result<{ newSentenceStructureData: SentenceStructureData }> {
  const newSentenceStructureData =
    xmlStringToSentenceStructureData.safeDecode(xmlString);

  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  return {
    success: false,
    message: "フォーマットが正しくありません。",
  };
}

export function createSentenceStructureDataFromSimplifiedAnnotationData(
  text: string,
  simplifiedAnnotationData: SimplifiedAnnotationData,
): Result<{ newSentenceStructureData: SentenceStructureData }> {
  const simplifiedSentenceStructureData: SimplifiedSentenceStructureData = {
    text: text,
    words: tokenizeText(text),
    ...simplifiedAnnotationData,
  };
  const newSentenceStructureData =
    simplifiedSentenceStructureDataToSentenceStructureData.safeDecode(
      simplifiedSentenceStructureData,
    );

  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureData.error;
}

export function sentenceStructureDataToString(
  sentenceStructureData: SentenceStructureData,
): string {
  return stringToSentenceStructureData.encode(sentenceStructureData);
}

export function sentenceStructureDataToXMLString(
  sentenceStructureData: SentenceStructureData,
): string {
  return xmlStringToSentenceStructureData.encode(sentenceStructureData);
}

export function createSentenceElementRange(
  sentenceStructureData: SentenceStructureData,
  input: {
    type: SentenceElementRangeType;
    startWordIndex: number;
    endWordIndex: number;
  },
): Result<{
  newSentenceStructureData: SentenceStructureData;
  rangeId: string;
}> {
  const rangeId = crypto.randomUUID();
  const newSentenceStructureData = SentenceStructureDataSchema.safeParse({
    ...sentenceStructureData,
    ranges: [
      ...sentenceStructureData.ranges,
      {
        kind: "core-sentence-element",
        type: input.type,
        id: rangeId,
        startWordIndex: input.startWordIndex,
        endWordIndex: input.endWordIndex,
        sentenceElementName: null,
      },
    ],
  } satisfies SentenceStructureData);

  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
        rangeId,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureData.error;
}

export function createSentenceStructureRange(
  sentenceStructureData: SentenceStructureData,
  input: {
    type: SentenceStructureRangeType;
    startWordIndex: number;
    endWordIndex: number;
  },
): Result<{
  newSentenceStructureData: SentenceStructureData;
  rangeId: string;
}> {
  const rangeId = crypto.randomUUID();
  const newSentenceStructureData = SentenceStructureDataSchema.safeParse({
    ...sentenceStructureData,
    ranges: [
      ...sentenceStructureData.ranges,
      {
        kind: "sentence-structure",
        type: input.type,
        id: rangeId,
        startWordIndex: input.startWordIndex,
        endWordIndex: input.endWordIndex,
        sentenceElementName: null,
      },
    ],
  } satisfies SentenceStructureData);

  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
        rangeId,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureData.error;
}

export function findRangeById(
  sentenceStructureData: SentenceStructureData,
  input: { rangeId: string },
): Range | null {
  return (
    sentenceStructureData.ranges.find((range) => range.id === input.rangeId) ??
    null
  );
}

export function findRangeByStartAndEndWordIndex(
  sentenceStructureData: SentenceStructureData,
  input: { startWordIndex: number; endWordIndex: number },
): Range | null {
  return (
    sentenceStructureData.ranges.find(
      (range) =>
        range.startWordIndex === input.startWordIndex &&
        range.endWordIndex === input.endWordIndex,
    ) ?? null
  );
}

export function updateSentenceElementName<RangeType>(
  sentenceStructureData: SentenceStructureData,
  input: {
    rangeId: string;
    sentenceElementName: RangeType extends SentenceElementRangeType
      ? (typeof sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap)[RangeType][number]
      : RangeType extends SentenceStructureRangeType
        ? (typeof sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap)[RangeType][number]
        : never;
  },
): SentenceStructureData {
  return SentenceStructureDataSchema.parse({
    ...sentenceStructureData,
    ranges: sentenceStructureData.ranges.map((range) =>
      range.id === input.rangeId
        ? ({
            ...range,
            sentenceElementName: input.sentenceElementName,
          } as Range)
        : range,
    ),
  } satisfies SentenceStructureData);
}

export function deleteRange(
  sentenceStructureData: SentenceStructureData,
  input: { rangeId: string },
): SentenceStructureData {
  return SentenceStructureDataSchema.parse({
    ...sentenceStructureData,
    ranges: sentenceStructureData.ranges.filter(
      (range) => range.id !== input.rangeId,
    ),
    relations: sentenceStructureData.relations.filter(
      (relation) =>
        relation.fromRangeId !== input.rangeId &&
        relation.toRangeId !== input.rangeId,
    ),
  } satisfies SentenceStructureData);
}

export function createRelation(
  sentenceStructureData: SentenceStructureData,
  input: {
    fromRange: { startWordIndex: number; endWordIndex: number };
    toRange: { startWordIndex: number; endWordIndex: number };
  },
): Result<{ newSentenceStructureData: SentenceStructureData }> {
  const fromRangeResult: {
    newSentenceStructureData: SentenceStructureData;
    rangeId: string;
  } = (() => {
    const existingFromRange = findRangeByStartAndEndWordIndex(
      sentenceStructureData,
      {
        startWordIndex: input.fromRange.startWordIndex,
        endWordIndex: input.fromRange.endWordIndex,
      },
    );
    if (existingFromRange) {
      return {
        newSentenceStructureData: sentenceStructureData,
        rangeId: existingFromRange.id,
      };
    }

    const rangeId = crypto.randomUUID();
    const newSentenceStructureData: SentenceStructureData = {
      ...sentenceStructureData,
      ranges: [
        ...sentenceStructureData.ranges,
        {
          kind: "relation",
          type: "relation",
          id: rangeId,
          startWordIndex: input.fromRange.startWordIndex,
          endWordIndex: input.fromRange.endWordIndex,
        },
      ],
    };
    return {
      newSentenceStructureData,
      rangeId,
    };
  })();

  const toRangeResult: {
    newSentenceStructureData: SentenceStructureData;
    rangeId: string;
  } = (() => {
    const existingToRange = findRangeByStartAndEndWordIndex(
      fromRangeResult.newSentenceStructureData,
      {
        startWordIndex: input.toRange.startWordIndex,
        endWordIndex: input.toRange.endWordIndex,
      },
    );
    if (existingToRange) {
      return {
        newSentenceStructureData: fromRangeResult.newSentenceStructureData,
        rangeId: existingToRange.id,
      };
    }

    const rangeId = crypto.randomUUID();
    const newSentenceStructureData: SentenceStructureData = {
      ...fromRangeResult.newSentenceStructureData,
      ranges: [
        ...fromRangeResult.newSentenceStructureData.ranges,
        {
          kind: "relation",
          type: "relation",
          id: rangeId,
          startWordIndex: input.toRange.startWordIndex,
          endWordIndex: input.toRange.endWordIndex,
        },
      ],
    };
    return {
      newSentenceStructureData,
      rangeId,
    };
  })();

  const newSentenceStructureData = SentenceStructureDataSchema.safeParse({
    ...toRangeResult.newSentenceStructureData,
    relations: [
      ...toRangeResult.newSentenceStructureData.relations,
      {
        id: crypto.randomUUID(),
        fromRangeId: fromRangeResult.rangeId,
        toRangeId: toRangeResult.rangeId,
      },
    ],
  } satisfies SentenceStructureData);
  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureData.error;
}

export function findRelationById(
  sentenceStructureData: SentenceStructureData,
  input: { relationId: string },
): Relation | null {
  return (
    sentenceStructureData.relations.find(
      (relation) => relation.id === input.relationId,
    ) ?? null
  );
}

export function deleteRelation(
  sentenceStructureData: SentenceStructureData,
  input: { relationId: string },
): SentenceStructureData {
  return SentenceStructureDataSchema.parse({
    ...sentenceStructureData,
    ranges: sentenceStructureData.ranges.filter(
      (range) =>
        range.kind !== "relation" ||
        sentenceStructureData.relations.some(
          (relation) =>
            relation.fromRangeId !== range.id &&
            relation.toRangeId !== range.id,
        ),
    ),
    relations: sentenceStructureData.relations.filter(
      (relation) => relation.id !== input.relationId,
    ),
  } satisfies SentenceStructureData);
}

export function createCoordination(
  sentenceStructureData: SentenceStructureData,
  input: {
    children: {
      type: CoordinationChildType;
      startWordIndex: number;
      endWordIndex: number;
    }[];
  },
): Result<{
  newSentenceStructureData: SentenceStructureData;
}> {
  const newSentenceStructureData = SentenceStructureDataSchema.safeParse({
    ...sentenceStructureData,
    coordinations: [
      ...sentenceStructureData.coordinations,
      {
        id: crypto.randomUUID(),
        children: input.children
          .sort((a, b) => a.startWordIndex - b.startWordIndex)
          .map((child, index) => ({
            type: child.type,
            index,
            startWordIndex: child.startWordIndex,
            endWordIndex: child.endWordIndex,
          })),
      },
    ],
  } satisfies SentenceStructureData);
  if (newSentenceStructureData.success) {
    return {
      success: true,
      data: {
        newSentenceStructureData: newSentenceStructureData.data,
      },
    };
  }
  const errorMessage =
    newSentenceStructureData.error.issues.find(
      (issue) => issue.code === "custom",
    )?.message ?? null;
  if (errorMessage) {
    return {
      success: false,
      message: errorMessage,
    };
  }
  throw newSentenceStructureData.error;
}

export function findCoordinationById(
  sentenceStructureData: SentenceStructureData,
  input: { coordinationId: string },
): Coordination | null {
  return (
    sentenceStructureData.coordinations.find(
      (coordination) => coordination.id === input.coordinationId,
    ) ?? null
  );
}

export function findCoordinationByStartAndEndWordIndex(
  sentenceStructureData: SentenceStructureData,
  input: { startWordIndex: number; endWordIndex: number },
): Coordination | null {
  return (
    sentenceStructureData.coordinations.find(
      (coordination) =>
        coordination.children.at(0)!.startWordIndex === input.startWordIndex &&
        coordination.children.at(-1)!.endWordIndex === input.endWordIndex,
    ) ?? null
  );
}

export function deleteCoordination(
  sentenceStructureData: SentenceStructureData,
  input: { coordinationId: string },
): SentenceStructureData {
  return SentenceStructureDataSchema.parse({
    ...sentenceStructureData,
    coordinations: sentenceStructureData.coordinations.filter(
      (coordination) => coordination.id !== input.coordinationId,
    ),
  } satisfies SentenceStructureData);
}
