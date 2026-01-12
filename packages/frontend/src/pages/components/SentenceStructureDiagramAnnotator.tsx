import { Fragment } from "react/jsx-runtime";
import { alpha, useTheme } from "@mui/material";
import {
  findCoordinationById,
  findRangeById,
  findRelationById,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type { SentenceStructureDiagramData } from "@sentence-structure-diagram-app/sentence-structure-diagram-data";
import { useSentenceStructureData } from "../contexts/SentenceStructureDataProvider";
import { useInteractionState } from "../contexts/InteractionStateProvider";

type SentenceStructureDiagramAnnotatorProps = {
  sentenceStructureDiagramData: SentenceStructureDiagramData;
};

export default function SentenceStructureDiagramAnnotator(
  props: SentenceStructureDiagramAnnotatorProps,
) {
  const theme = useTheme();

  const { sentenceStructureData } = useSentenceStructureData();

  const {
    interactionState,
    handleMouseUpOnWord,
    handleMouseEnterOnWord,
    handleMouseDownOnWord,
    handleClickOnRange,
    handleClickOnRelation,
    handleClickOnCoordination,
  } = useInteractionState();

  return (
    <svg
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${props.sentenceStructureDiagramData.position.right} ${props.sentenceStructureDiagramData.position.bottom}`}
    >
      {/* 単語と括弧類 */}
      {props.sentenceStructureDiagramData.words.map((word) => {
        const isWithinSelectingRange =
          (interactionState.type === "range-selecting" ||
            interactionState.type === "relation-selecting" ||
            interactionState.type === "coordination-selecting") &&
          Math.min(
            interactionState.anchorWordIndex,
            interactionState.focusWordIndex,
          ) <= word.index &&
          word.index <=
            Math.max(
              interactionState.anchorWordIndex,
              interactionState.focusWordIndex,
            );
        const isWithinConfirmingRange =
          (interactionState.type === "range-confirming" ||
            interactionState.type === "coordination-confirming") &&
          interactionState.startWordIndex <= word.index &&
          word.index <= interactionState.endWordIndex;
        const isWithinSelectedCoordinationChild = (() => {
          if (
            !(
              interactionState.type === "coordination-idle" ||
              interactionState.type === "coordination-selecting" ||
              interactionState.type === "coordination-confirming"
            )
          )
            return false;
          return interactionState.children.some(
            (child) =>
              child.startWordIndex <= word.index &&
              word.index <= child.endWordIndex,
          );
        })();
        const isWithinSelectedRange = (() => {
          if (
            !(
              interactionState.type === "range-selected" ||
              interactionState.type === "relation-idle" ||
              interactionState.type === "relation-selecting"
            )
          )
            return false;
          const range =
            interactionState.type === "range-selected"
              ? findRangeById(sentenceStructureData, {
                  rangeId: interactionState.rangeId,
                })
              : interactionState.fromRange;
          return (
            range !== null &&
            range.startWordIndex <= word.index &&
            word.index <= range.endWordIndex
          );
        })();
        const isWithinSelectedRelationRange = (() => {
          if (interactionState.type !== "relation-selected") return false;
          const relation = findRelationById(sentenceStructureData, {
            relationId: interactionState.relationId,
          });
          if (relation === null) return false;
          const fromRange = findRangeById(sentenceStructureData, {
            rangeId: relation.fromRangeId,
          });
          const toRange = findRangeById(sentenceStructureData, {
            rangeId: relation.toRangeId,
          });
          if (fromRange === null || toRange === null) return false;
          return (
            (fromRange.startWordIndex <= word.index &&
              word.index <= fromRange.endWordIndex) ||
            (toRange.startWordIndex <= word.index &&
              word.index <= toRange.endWordIndex)
          );
        })();
        const isWithinSelectedCoordination = (() => {
          if (interactionState.type !== "coordination-selected") return false;
          const coordination = findCoordinationById(sentenceStructureData, {
            coordinationId: interactionState.coordinationId,
          });
          if (coordination === null) return false;
          return coordination.children.some(
            (child) =>
              child.startWordIndex <= word.index &&
              word.index <= child.endWordIndex,
          );
        })();
        const isSelecting = isWithinSelectingRange || isWithinConfirmingRange;
        const isSelected =
          isWithinSelectedCoordinationChild ||
          isWithinSelectedRange ||
          isWithinSelectedRelationRange ||
          isWithinSelectedCoordination;

        return (
          <Fragment key={word.index}>
            {word.openingBrackets.length > 0 && (
              <text
                x={word.position.left}
                y={word.position.bottom}
                textAnchor="end"
                fill={theme.palette.primary.main}
                fontFamily={theme.typography.fontFamily}
                style={{ userSelect: "none" }}
              >
                {word.openingBrackets.join("")}
              </text>
            )}
            <g
              key={word.index}
              style={{
                userSelect: "none",
                cursor: "pointer",
              }}
              onMouseDown={() => {
                const result = handleMouseDownOnWord(word.index);
                if (!result.success) {
                  alert(result.message);
                }
              }}
              onMouseEnter={(e) => {
                if (e.buttons !== 1) return;
                const result = handleMouseEnterOnWord(word.index);
                if (!result.success) {
                  alert(result.message);
                }
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                const result = handleMouseUpOnWord(word.index);
                if (!result.success) {
                  alert(result.message);
                }
              }}
            >
              <rect
                x={word.position.left - 8}
                y={word.position.top - 8}
                width={word.position.right - word.position.left + 16}
                height={word.position.bottom - word.position.top + 16}
                rx={8}
                ry={8}
                fill={
                  isSelecting
                    ? alpha(
                        theme.palette.primary.main,
                        theme.palette.action.selectedOpacity,
                      )
                    : isSelected
                      ? alpha(
                          theme.palette.primary.main,
                          theme.palette.action.focusOpacity,
                        )
                      : "transparent"
                }
              />
              <text
                x={word.position.left}
                y={word.position.bottom}
                textAnchor="start"
                fill={theme.palette.text.primary}
                fontFamily={theme.typography.fontFamily}
              >
                {word.text}
              </text>
            </g>
            {word.closingBrackets.length > 0 && (
              <text
                x={word.position.right}
                y={word.position.bottom}
                textAnchor="start"
                fill={theme.palette.primary.main}
                fontFamily={theme.typography.fontFamily}
              >
                {word.closingBrackets.join("")}
              </text>
            )}
          </Fragment>
        );
      })}
      {/* 下線 */}
      {props.sentenceStructureDiagramData.underlines.map((underline) =>
        underline.position.map((position, index) => (
          <line
            key={`${underline.rangeId}-${index}`}
            x1={position.start}
            x2={position.end}
            y1={position.bottom}
            y2={position.bottom}
            stroke={theme.palette.primary.main}
            strokeWidth={2}
          />
        )),
      )}
      {/* 文の要素の記号 */}
      {props.sentenceStructureDiagramData.sentenceElements.map(
        (sentenceElement) =>
          sentenceElement.symbol && (
            <text
              key={sentenceElement.rangeId}
              x={sentenceElement.position.x}
              y={sentenceElement.position.y}
              textAnchor="middle"
              fill={theme.palette.primary.main}
              fontFamily={theme.typography.fontFamily}
              dominantBaseline="hanging"
              style={{ userSelect: "none", cursor: "pointer" }}
              onClick={() => {
                const result = handleClickOnRange(sentenceElement.rangeId);
                if (!result.success) {
                  alert(result.message);
                }
              }}
            >
              {sentenceElement.symbol}
            </text>
          ),
      )}
      {/* 修飾 */}
      {props.sentenceStructureDiagramData.relations.map((relation) => (
        <path
          key={relation.relationId}
          d={relation.svgPathData}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const result = handleClickOnRelation(relation.relationId);
            if (!result.success) {
              alert(result.message);
            }
          }}
        />
      ))}
      {/* 並列 */}
      {props.sentenceStructureDiagramData.coordinations.map((coordination) => (
        <path
          key={coordination.coordinationId}
          d={coordination.svgPathData}
          fill="none"
          stroke={theme.palette.primary.main}
          strokeWidth={2}
          style={{ cursor: "pointer" }}
          onClick={() => {
            const result = handleClickOnCoordination(
              coordination.coordinationId,
            );
            if (!result.success) {
              alert(result.message);
            }
          }}
        />
      ))}
    </svg>
  );
}
