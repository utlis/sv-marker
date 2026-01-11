import {
  findRangeById,
  type Range,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";

function isSameRange(range1: Range, range2: Range): boolean {
  return (
    range1.startWordIndex === range2.startWordIndex &&
    range1.endWordIndex === range2.endWordIndex &&
    range1.type === range2.type &&
    (range1.type === "relation" ||
      (range2.type !== "relation" &&
        range1.sentenceElementName === range2.sentenceElementName))
  );
}

function isSameRangeStartAndEndWordIndex(
  range1: Range,
  range2: Range,
): boolean {
  return (
    range1.startWordIndex === range2.startWordIndex &&
    range1.endWordIndex === range2.endWordIndex
  );
}

type CompareResult = {
  answerRangeCount: number;
  answerRelationCount: number;
  answerCoordinationCount: number;
  llmAnswerRangeCount: number;
  llmAnswerRelationCount: number;
  llmAnswerCoordinationCount: number;
  correctRangeCount: number;
  correctRangeStartAndEndWordIndexCount: number;
  correctRelationCount: number;
  correctRelationStartAndEndWordIndexCount: number;
  correctCoordinationCount: number;
  correctCoordinationStartAndEndWordIndexCount: number;
};

function compareSentenceStructureData(
  answer: SentenceStructureData,
  llmAnswer: SentenceStructureData | null,
): CompareResult {
  return {
    answerRangeCount: answer.ranges.length,
    answerRelationCount: answer.relations.length,
    answerCoordinationCount: answer.coordinations.length,
    llmAnswerRangeCount: llmAnswer?.ranges.length ?? 0,
    llmAnswerRelationCount: llmAnswer?.relations.length ?? 0,
    llmAnswerCoordinationCount: llmAnswer?.coordinations.length ?? 0,
    correctRangeCount:
      llmAnswer?.ranges.filter((llmRange) =>
        answer.ranges.some((answerRange) => isSameRange(llmRange, answerRange)),
      ).length ?? 0,
    correctRangeStartAndEndWordIndexCount:
      llmAnswer?.ranges.filter((llmRange) =>
        answer.ranges.some((answerRange) =>
          isSameRangeStartAndEndWordIndex(llmRange, answerRange),
        ),
      ).length ?? 0,
    correctRelationCount:
      llmAnswer?.relations.filter((llmRelation) =>
        answer.relations.some(
          (answerRelation) =>
            isSameRange(
              findRangeById(llmAnswer, { rangeId: llmRelation.fromRangeId })!,
              findRangeById(answer, { rangeId: answerRelation.fromRangeId })!,
            ) &&
            isSameRange(
              findRangeById(llmAnswer, { rangeId: llmRelation.toRangeId })!,
              findRangeById(answer, { rangeId: answerRelation.toRangeId })!,
            ),
        ),
      ).length ?? 0,
    correctRelationStartAndEndWordIndexCount:
      llmAnswer?.relations.filter((llmRelation) =>
        answer.relations.some(
          (answerRelation) =>
            isSameRangeStartAndEndWordIndex(
              findRangeById(llmAnswer, { rangeId: llmRelation.fromRangeId })!,
              findRangeById(answer, { rangeId: answerRelation.fromRangeId })!,
            ) &&
            isSameRangeStartAndEndWordIndex(
              findRangeById(llmAnswer, { rangeId: llmRelation.toRangeId })!,
              findRangeById(answer, { rangeId: answerRelation.toRangeId })!,
            ),
        ),
      ).length ?? 0,
    correctCoordinationCount:
      llmAnswer?.coordinations.filter((llmCoordination) =>
        answer.coordinations.some(
          (answerCoordination) =>
            llmCoordination.children.every(
              (llmCoordinationChild) =>
                llmCoordinationChild.startWordIndex ===
                  answerCoordination.children.at(llmCoordinationChild.index)
                    ?.startWordIndex &&
                llmCoordinationChild.endWordIndex ===
                  answerCoordination.children.at(llmCoordinationChild.index)
                    ?.endWordIndex &&
                llmCoordinationChild.type ===
                  answerCoordination.children.at(llmCoordinationChild.index)
                    ?.type,
            ) &&
            llmCoordination.children.length ===
              answerCoordination.children.length,
        ),
      ).length ?? 0,
    correctCoordinationStartAndEndWordIndexCount:
      llmAnswer?.coordinations.filter((llmCoordination) =>
        answer.coordinations.some((answerCoordination) =>
          llmCoordination.children.every(
            (llmCoordinationChild) =>
              llmCoordinationChild.startWordIndex ===
                answerCoordination.children.at(llmCoordinationChild.index)
                  ?.startWordIndex &&
              llmCoordinationChild.endWordIndex ===
                answerCoordination.children.at(llmCoordinationChild.index)
                  ?.endWordIndex,
          ),
        ),
      ).length ?? 0,
  };
}

function calculateMetrics(
  truePositive: number,
  falsePositive: number,
  falseNegative: number,
) {
  const recall = truePositive / (truePositive + falseNegative);
  const precision = truePositive / (truePositive + falsePositive);
  const f1Score =
    recall === 0 && precision === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  return {
    count: truePositive + falseNegative,
    recall,
    precision,
    f1Score,
  };
}

export function calculateOverallMetrics(
  answerLlMAnswerPairs: {
    answer: SentenceStructureData;
    llmAnswer: SentenceStructureData | null;
  }[],
) {
  const compareResults = answerLlMAnswerPairs.map(({ answer, llmAnswer }) =>
    compareSentenceStructureData(answer, llmAnswer),
  );

  const totalResult: CompareResult = compareResults.reduce(
    (accumulator, currentValue) => {
      return {
        answerRangeCount:
          accumulator.answerRangeCount + currentValue.answerRangeCount,
        answerRelationCount:
          accumulator.answerRelationCount + currentValue.answerRelationCount,
        answerCoordinationCount:
          accumulator.answerCoordinationCount +
          currentValue.answerCoordinationCount,
        llmAnswerRangeCount:
          accumulator.llmAnswerRangeCount + currentValue.llmAnswerRangeCount,
        llmAnswerRelationCount:
          accumulator.llmAnswerRelationCount +
          currentValue.llmAnswerRelationCount,
        llmAnswerCoordinationCount:
          accumulator.llmAnswerCoordinationCount +
          currentValue.llmAnswerCoordinationCount,
        correctRangeCount:
          accumulator.correctRangeCount + currentValue.correctRangeCount,
        correctRangeStartAndEndWordIndexCount:
          accumulator.correctRangeStartAndEndWordIndexCount +
          currentValue.correctRangeStartAndEndWordIndexCount,
        correctRelationCount:
          accumulator.correctRelationCount + currentValue.correctRelationCount,
        correctRelationStartAndEndWordIndexCount:
          accumulator.correctRelationStartAndEndWordIndexCount +
          currentValue.correctRelationStartAndEndWordIndexCount,
        correctCoordinationCount:
          accumulator.correctCoordinationCount +
          currentValue.correctCoordinationCount,
        correctCoordinationStartAndEndWordIndexCount:
          accumulator.correctCoordinationStartAndEndWordIndexCount +
          currentValue.correctCoordinationStartAndEndWordIndexCount,
      };
    },
    {
      answerRangeCount: 0,
      answerRelationCount: 0,
      answerCoordinationCount: 0,
      llmAnswerRangeCount: 0,
      llmAnswerRelationCount: 0,
      llmAnswerCoordinationCount: 0,
      correctRangeCount: 0,
      correctRangeStartAndEndWordIndexCount: 0,
      correctRelationCount: 0,
      correctRelationStartAndEndWordIndexCount: 0,
      correctCoordinationCount: 0,
      correctCoordinationStartAndEndWordIndexCount: 0,
    },
  );

  const rangeMetrics = calculateMetrics(
    totalResult.correctRangeCount,
    totalResult.llmAnswerRangeCount - totalResult.correctRangeCount,
    totalResult.answerRangeCount - totalResult.correctRangeCount,
  );

  const rangeStartAndEndWordIndexMetrics = calculateMetrics(
    totalResult.correctRangeStartAndEndWordIndexCount,
    totalResult.llmAnswerRangeCount -
      totalResult.correctRangeStartAndEndWordIndexCount,
    totalResult.answerRangeCount -
      totalResult.correctRangeStartAndEndWordIndexCount,
  );

  const relationMetrics = calculateMetrics(
    totalResult.correctRelationCount,
    totalResult.llmAnswerRelationCount - totalResult.correctRelationCount,
    totalResult.answerRelationCount - totalResult.correctRelationCount,
  );

  const relationStartAndEndWordIndexMetrics = calculateMetrics(
    totalResult.correctRelationStartAndEndWordIndexCount,
    totalResult.llmAnswerRelationCount -
      totalResult.correctRelationStartAndEndWordIndexCount,
    totalResult.answerRelationCount -
      totalResult.correctRelationStartAndEndWordIndexCount,
  );

  const coordinationMetrics = calculateMetrics(
    totalResult.correctCoordinationCount,
    totalResult.llmAnswerCoordinationCount -
      totalResult.correctCoordinationCount,
    totalResult.answerCoordinationCount - totalResult.correctCoordinationCount,
  );

  const coordinationStartAndEndWordIndexMetrics = calculateMetrics(
    totalResult.correctCoordinationStartAndEndWordIndexCount,
    totalResult.llmAnswerCoordinationCount -
      totalResult.correctCoordinationStartAndEndWordIndexCount,
    totalResult.answerCoordinationCount -
      totalResult.correctCoordinationStartAndEndWordIndexCount,
  );

  return {
    generationRate:
      answerLlMAnswerPairs.filter(({ llmAnswer }) => llmAnswer !== null)
        .length / answerLlMAnswerPairs.length,
    rangeCount: rangeMetrics.count,
    rangeRecall: rangeMetrics.recall,
    rangePrecision: rangeMetrics.precision,
    rangeF1Score: rangeMetrics.f1Score,
    rangeStartAndEndWordIndexRecall: rangeStartAndEndWordIndexMetrics.recall,
    rangeStartAndEndWordIndexPrecision:
      rangeStartAndEndWordIndexMetrics.precision,
    rangeStartAndEndWordIndexF1Score: rangeStartAndEndWordIndexMetrics.f1Score,
    relationCount: relationMetrics.count,
    relationRecall: relationMetrics.recall,
    relationPrecision: relationMetrics.precision,
    relationF1Score: relationMetrics.f1Score,
    relationStartAndEndWordIndexRecall:
      relationStartAndEndWordIndexMetrics.recall,
    relationStartAndEndWordIndexPrecision:
      relationStartAndEndWordIndexMetrics.precision,
    relationStartAndEndWordIndexF1Score:
      relationStartAndEndWordIndexMetrics.f1Score,
    coordinationCount: coordinationMetrics.count,
    coordinationRecall: coordinationMetrics.recall,
    coordinationPrecision: coordinationMetrics.precision,
    coordinationF1Score: coordinationMetrics.f1Score,
    coordinationStartAndEndWordIndexRecall:
      coordinationStartAndEndWordIndexMetrics.recall,
    coordinationStartAndEndWordIndexPrecision:
      coordinationStartAndEndWordIndexMetrics.precision,
    coordinationStartAndEndWordIndexF1Score:
      coordinationStartAndEndWordIndexMetrics.f1Score,
  };
}
