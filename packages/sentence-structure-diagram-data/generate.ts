import {
  findRangeById,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type { Configurations } from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import { createTree } from "@sentence-structure-diagram-app/sentence-structure-tree";
import { createSentenceStructureDiagramTree } from "@sentence-structure-diagram-app/sentence-structure-diagram-tree";
import type { SentenceStructureDiagramData } from "./types.js";
import {
  extractSpanPosition,
  extractWordPositions,
} from "./extract-position.js";
import { resolveConfigurations } from "./resolve-configurations.js";

export function convertSentenceStructureDataToSentenceStructureDiagramData(
  sentenceStructureData: SentenceStructureData,
  maxWidth: number,
  measureTextWidth: (text: string) => number,
  customConfigurations: Partial<Configurations>,
): SentenceStructureDiagramData {
  const resolvedConfigurations = resolveConfigurations(customConfigurations);

  const tree = createTree(sentenceStructureData);
  const treePosition = createSentenceStructureDiagramTree(
    tree,
    maxWidth,
    measureTextWidth,
    resolvedConfigurations.layoutMode,
  );
  const wordPositions = extractWordPositions(treePosition);

  return {
    position: {
      left: treePosition.position.start,
      right: treePosition.position.end,
      top: treePosition.position.top,
      bottom: treePosition.position.bottom,
    },
    color: {
      primaryColor: resolvedConfigurations.color.primaryColor,
      textColor: resolvedConfigurations.color.textColor,
    },
    words: sentenceStructureData.words.map((word) => ({
      index: word.index,
      text: word.text,
      openingBrackets: sentenceStructureData.ranges
        .filter((range) => range.kind === "sentence-structure")
        .filter((range) => range.startWordIndex === word.index)
        .sort((a, b) => b.endWordIndex - a.endWordIndex)
        .map(
          (range) =>
            resolvedConfigurations.sentenceStructureRangeTypeToBracketsMap[
              range.type
            ].openingBracket,
        ),
      closingBrackets: sentenceStructureData.ranges
        .filter((range) => range.kind === "sentence-structure")
        .filter((range) => range.endWordIndex === word.index)
        .sort((a, b) => b.startWordIndex - a.startWordIndex)
        .map(
          (range) =>
            resolvedConfigurations.sentenceStructureRangeTypeToBracketsMap[
              range.type
            ].closingBracket,
        ),
      position: {
        left: wordPositions[word.index]!.start,
        right: wordPositions[word.index]!.end,
        top: wordPositions[word.index]!.top,
        bottom: wordPositions[word.index]!.bottom,
      },
    })),
    underlines: sentenceStructureData.ranges
      .filter((range) => range.type === "core-sentence-element")
      .map((range) => {
        const rangePosition = extractSpanPosition(
          wordPositions,
          range.startWordIndex,
          range.endWordIndex,
        );
        return {
          rangeId: range.id,
          position: rangePosition.map((position) => ({
            start: position.start,
            end: position.end,
            bottom: position.bottom + 4,
          })),
        };
      }),
    sentenceElements: sentenceStructureData.ranges
      .filter((range) => range.kind !== "relation")
      .map((range) => {
        const rangePosition = extractSpanPosition(
          wordPositions,
          range.startWordIndex,
          range.endWordIndex,
        );
        return {
          rangeId: range.id,
          symbol: range.sentenceElementName
            ? resolvedConfigurations
                .sentenceElementNameToSentenceElementSymbolMap[
                range.sentenceElementName
              ]
            : null,
          position:
            range.kind === "sentence-element"
              ? resolvedConfigurations.sentenceElementPosition.determineSentenceElementRangeSentenceElementPosition(
                  rangePosition,
                )
              : resolvedConfigurations.sentenceElementPosition.determineSentenceStructureRangeSentenceElementPosition(
                  rangePosition,
                ),
        };
      }),
    relations: sentenceStructureData.relations.map((relation) => {
      const fromRange = findRangeById(sentenceStructureData, {
        rangeId: relation.fromRangeId,
      });
      const toRange = findRangeById(sentenceStructureData, {
        rangeId: relation.toRangeId,
      });
      if (!fromRange || !toRange) {
        throw new Error(
          `Relation ${relation.id} has invalid range references.`,
        );
      }

      const fromRangePosition = extractSpanPosition(
        wordPositions,
        fromRange.startWordIndex,
        fromRange.endWordIndex,
      );
      const toRangePosition = extractSpanPosition(
        wordPositions,
        toRange.startWordIndex,
        toRange.endWordIndex,
      );

      return {
        relationId: relation.id,
        svgPathData: resolvedConfigurations.determineRelationSvgPathData(
          fromRangePosition,
          toRangePosition,
        ),
      };
    }),
    coordinations: sentenceStructureData.coordinations.map((coordination) => {
      const coordinationPosition = {
        position: extractSpanPosition(
          wordPositions,
          coordination.children.at(0)!.startWordIndex,
          coordination.children.at(-1)!.endWordIndex,
        ),
        childrenPositions: coordination.children.map((child) =>
          extractSpanPosition(
            wordPositions,
            child.startWordIndex,
            child.endWordIndex,
          ),
        ),
      };
      return {
        coordinationId: coordination.id,
        svgPathData:
          resolvedConfigurations.determineCoordinationSvgPathData(
            coordinationPosition,
          ),
      };
    }),
  };
}
