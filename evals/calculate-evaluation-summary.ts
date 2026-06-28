import type {
  Coordination,
  Modification,
  Sentence,
  SentenceStructureDocument,
  SentenceStructureElement,
} from "@sv-marker/sentence-structure-document";

function isSameSentenceStructureElement(
  aSentenceStructureElement: SentenceStructureElement,
  bSentenceStructureElement: SentenceStructureElement,
  aSentence: Sentence,
  bSentence: Sentence,
): boolean {
  if (
    aSentence.words.find(
      (word) => word.id === aSentenceStructureElement.startWordId,
    )!.index !==
      bSentence.words.find(
        (word) => word.id === bSentenceStructureElement.startWordId,
      )!.index ||
    aSentence.words.find(
      (word) => word.id === aSentenceStructureElement.endWordId,
    )!.index !==
      bSentence.words.find(
        (word) => word.id === bSentenceStructureElement.endWordId,
      )!.index
  ) {
    return false;
  }

  switch (aSentenceStructureElement.kind) {
    case "core-sentence-element": {
      return (
        aSentenceStructureElement.kind === bSentenceStructureElement.kind &&
        aSentenceStructureElement.sentenceElementName ===
          bSentenceStructureElement.sentenceElementName
      );
    }
    case "sentence-constituent": {
      switch (aSentenceStructureElement.type) {
        case "verbal-phrase":
        case "clause": {
          return (
            aSentenceStructureElement.kind === bSentenceStructureElement.kind &&
            aSentenceStructureElement.type === bSentenceStructureElement.type &&
            aSentenceStructureElement.usage ===
              bSentenceStructureElement.usage &&
            aSentenceStructureElement.sentenceElementName ===
              bSentenceStructureElement.sentenceElementName
          );
        }
        case "modifier-phrase": {
          return (
            aSentenceStructureElement.kind === bSentenceStructureElement.kind &&
            aSentenceStructureElement.type === bSentenceStructureElement.type &&
            aSentenceStructureElement.sentenceElementName ===
              bSentenceStructureElement.sentenceElementName
          );
        }
        default: {
          aSentenceStructureElement satisfies never;
          throw new Error("Unreachable");
        }
      }
    }
    case "modification-element": {
      return aSentenceStructureElement.kind === bSentenceStructureElement.kind;
    }
    default: {
      aSentenceStructureElement satisfies never;
      throw new Error("Unreachable");
    }
  }
}

function isSameModification(
  aModification: Modification,
  bModification: Modification,
  aSentence: Sentence,
  bSentence: Sentence,
): boolean {
  const aModifierSentenceStructureElement =
    aSentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.id ===
        aModification.modifierSentenceStructureElementId,
    );
  const bModifierSentenceStructureElement =
    bSentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.id ===
        bModification.modifierSentenceStructureElementId,
    );
  if (
    !aModifierSentenceStructureElement ||
    !bModifierSentenceStructureElement
  ) {
    throw new Error("Modifier sentence structure element not found");
  }

  const aModifiedSentenceStructureElement =
    aSentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.id ===
        aModification.modifiedSentenceStructureElementId,
    );
  const bModifiedSentenceStructureElement =
    bSentence.sentenceStructureElements.find(
      (sentenceStructureElement) =>
        sentenceStructureElement.id ===
        bModification.modifiedSentenceStructureElementId,
    );
  if (
    !aModifiedSentenceStructureElement ||
    !bModifiedSentenceStructureElement
  ) {
    throw new Error("Modified sentence structure element not found");
  }

  return (
    isSameSentenceStructureElement(
      aModifierSentenceStructureElement,
      bModifierSentenceStructureElement,
      aSentence,
      bSentence,
    ) &&
    isSameSentenceStructureElement(
      aModifiedSentenceStructureElement,
      bModifiedSentenceStructureElement,
      aSentence,
      bSentence,
    )
  );
}

function isSameCoordination(
  aCoordination: Coordination,
  bCoordination: Coordination,
  aSentence: Sentence,
  bSentence: Sentence,
): boolean {
  if (aCoordination.parts.length !== bCoordination.parts.length) {
    return false;
  }

  return aCoordination.parts.every((aCoordinationPart, index) => {
    const bCoordinationPart = bCoordination.parts.at(index);
    if (!bCoordinationPart) {
      throw new Error("coordination part not found");
    }
    return (
      aCoordinationPart.type === bCoordinationPart.type &&
      aSentence.words.find((word) => word.id === aCoordinationPart.startWordId)!
        .index ===
        bSentence.words.find(
          (word) => word.id === bCoordinationPart.startWordId,
        )!.index &&
      aSentence.words.find((word) => word.id === aCoordinationPart.endWordId)!
        .index ===
        bSentence.words.find((word) => word.id === bCoordinationPart.endWordId)!
          .index
    );
  });
}

type AnswerPredictionPair = {
  answer: SentenceStructureDocument;
  prediction: SentenceStructureDocument | null;
};

type SentenceStructureDocumentCompareResult = {
  sentenceStructureElement: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
  modification: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
  coordination: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
};

function compareSentenceStructureDocument(
  answerPredictionPair: AnswerPredictionPair,
): SentenceStructureDocumentCompareResult {
  return {
    sentenceStructureElement: {
      answerCount: answerPredictionPair.answer.sentences.reduce(
        (count, sentence) => count + sentence.sentenceStructureElements.length,
        0,
      ),
      predictionCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, sentence) =>
            count + sentence.sentenceStructureElements.length,
          0,
        ) ?? 0,
      correctCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, predictionSentence) => {
            const answerSentence = answerPredictionPair.answer.sentences.find(
              (sentence) => sentence.index === predictionSentence.index,
            )!;
            return (
              count +
              predictionSentence.sentenceStructureElements.filter(
                (predictionSentenceStructureElement) =>
                  answerSentence.sentenceStructureElements.some(
                    (answerSentenceStructureElement) =>
                      isSameSentenceStructureElement(
                        predictionSentenceStructureElement,
                        answerSentenceStructureElement,
                        predictionSentence,
                        answerSentence,
                      ),
                  ),
              ).length
            );
          },
          0,
        ) ?? 0,
    },
    modification: {
      answerCount: answerPredictionPair.answer.sentences.reduce(
        (count, sentence) => count + sentence.modifications.length,
        0,
      ),
      predictionCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, sentence) => count + sentence.modifications.length,
          0,
        ) ?? 0,
      correctCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, predictionSentence) => {
            const answerSentence = answerPredictionPair.answer.sentences.find(
              (sentence) => sentence.index === predictionSentence.index,
            )!;
            return (
              count +
              predictionSentence.modifications.filter(
                (predictionModification) =>
                  answerSentence.modifications.some((answerModification) =>
                    isSameModification(
                      predictionModification,
                      answerModification,
                      predictionSentence,
                      answerSentence,
                    ),
                  ),
              ).length
            );
          },
          0,
        ) ?? 0,
    },
    coordination: {
      answerCount: answerPredictionPair.answer.sentences.reduce(
        (count, sentence) => count + sentence.coordinations.length,
        0,
      ),
      predictionCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, sentence) => count + sentence.coordinations.length,
          0,
        ) ?? 0,
      correctCount:
        answerPredictionPair.prediction?.sentences.reduce(
          (count, predictionSentence) => {
            const answerSentence = answerPredictionPair.answer.sentences.find(
              (sentence) => sentence.index === predictionSentence.index,
            )!;
            return (
              count +
              predictionSentence.coordinations.filter(
                (predictionCoordination) =>
                  answerSentence.coordinations.some((answerCoordination) =>
                    isSameCoordination(
                      predictionCoordination,
                      answerCoordination,
                      predictionSentence,
                      answerSentence,
                    ),
                  ),
              ).length
            );
          },
          0,
        ) ?? 0,
    },
  };
}

type SentenceStructureDocumentsCompareResult = {
  documentCount: number;
  generatedDocumentCount: number;
  sentenceStructureElement: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
  modification: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
  coordination: {
    answerCount: number;
    predictionCount: number;
    correctCount: number;
  };
};

function compareSentenceStructureDocuments(
  answerPredictionPairs: AnswerPredictionPair[],
): SentenceStructureDocumentsCompareResult {
  const compareResults = answerPredictionPairs.map((answerPredictionPair) =>
    compareSentenceStructureDocument(answerPredictionPair),
  );

  return {
    documentCount: answerPredictionPairs.length,
    generatedDocumentCount: answerPredictionPairs.filter(
      ({ prediction }) => prediction !== null,
    ).length,
    sentenceStructureElement: compareResults.reduce(
      (accumulator, compareResult) => ({
        answerCount:
          accumulator.answerCount +
          compareResult.sentenceStructureElement.answerCount,
        predictionCount:
          accumulator.predictionCount +
          compareResult.sentenceStructureElement.predictionCount,
        correctCount:
          accumulator.correctCount +
          compareResult.sentenceStructureElement.correctCount,
      }),
      {
        answerCount: 0,
        predictionCount: 0,
        correctCount: 0,
      },
    ),
    modification: compareResults.reduce(
      (accumulator, compareResult) => ({
        answerCount:
          accumulator.answerCount + compareResult.modification.answerCount,
        predictionCount:
          accumulator.predictionCount +
          compareResult.modification.predictionCount,
        correctCount:
          accumulator.correctCount + compareResult.modification.correctCount,
      }),
      {
        answerCount: 0,
        predictionCount: 0,
        correctCount: 0,
      },
    ),
    coordination: compareResults.reduce(
      (accumulator, compareResult) => ({
        answerCount:
          accumulator.answerCount + compareResult.coordination.answerCount,
        predictionCount:
          accumulator.predictionCount +
          compareResult.coordination.predictionCount,
        correctCount:
          accumulator.correctCount + compareResult.coordination.correctCount,
      }),
      {
        answerCount: 0,
        predictionCount: 0,
        correctCount: 0,
      },
    ),
  };
}

type CategoryEvaluationMetrics = {
  answerCount: number;
  predictionCount: number;
  correctCount: number;
  recall: number;
  precision: number;
  f1Score: number;
};

function calculateCategoryEvaluationMetrics(counts: {
  answerCount: number;
  predictionCount: number;
  correctCount: number;
}): CategoryEvaluationMetrics {
  const truePositive = counts.correctCount;
  const falsePositive = counts.predictionCount - counts.correctCount;
  const falseNegative = counts.answerCount - counts.correctCount;

  const recall =
    truePositive === 0 && falseNegative === 0
      ? 0
      : truePositive / (truePositive + falseNegative);
  const precision =
    truePositive === 0 && falsePositive === 0
      ? 0
      : truePositive / (truePositive + falsePositive);
  const f1Score =
    recall === 0 && precision === 0
      ? 0
      : (2 * precision * recall) / (precision + recall);
  return {
    answerCount: counts.answerCount,
    predictionCount: counts.predictionCount,
    correctCount: counts.correctCount,
    recall,
    precision,
    f1Score,
  };
}

type EvaluationSummary = {
  generationRate: number;
  sentenceStructureElement: CategoryEvaluationMetrics;
  modification: CategoryEvaluationMetrics;
  coordination: CategoryEvaluationMetrics;
};

export function calculateEvaluationSummary(
  answerPredictionPairs: AnswerPredictionPair[],
): EvaluationSummary {
  const compareResult = compareSentenceStructureDocuments(
    answerPredictionPairs,
  );

  return {
    generationRate:
      compareResult.documentCount === 0
        ? 0
        : compareResult.generatedDocumentCount / compareResult.documentCount,
    sentenceStructureElement: calculateCategoryEvaluationMetrics(
      compareResult.sentenceStructureElement,
    ),
    modification: calculateCategoryEvaluationMetrics(
      compareResult.modification,
    ),
    coordination: calculateCategoryEvaluationMetrics(
      compareResult.coordination,
    ),
  };
}
