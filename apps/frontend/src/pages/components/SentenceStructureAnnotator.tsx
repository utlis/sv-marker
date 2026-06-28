import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { alpha, useTheme } from "@mui/material";
import {
  createSentenceStructureDiagramData,
  type PathCommand,
} from "@sv-marker/sentence-structure-diagram";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";
import { useSentenceStructureDiagramAnnotationSettings } from "../contexts/SentenceStructureDiagramAnnotationSettingsProvider";
import { useInteractionState } from "../contexts/InteractionStateProvider";
import { measureTextWidth } from "../utils/measure-text-width";

export default function SentenceStructureAnnotator() {
  const theme = useTheme();

  const { sentenceStructureDocument } = useSentenceStructureDocument();

  const { resolvedSentenceStructureDiagramNotation } =
    useSentenceStructureDiagramAnnotationSettings();

  const {
    interactionState,
    handlePointerUpOnWord,
    handlePointerEnterOnWord,
    handlePointerDownOnWord,
    handleSelectSentenceStructureElement,
    handleSelectModification,
    handleSelectCoordination,
  } = useInteractionState();

  const sentenceStructureDiagramData = useMemo(
    () =>
      createSentenceStructureDiagramData(
        sentenceStructureDocument,
        resolvedSentenceStructureDiagramNotation,
        measureTextWidth,
      ),
    [sentenceStructureDocument, resolvedSentenceStructureDiagramNotation],
  );

  function pathCommandsToSVGPathData(pathCommands: PathCommand[]): string {
    return pathCommands
      .map((pathCommand) => {
        switch (pathCommand.type) {
          case "move-to":
            return `M ${pathCommand.to.x} ${pathCommand.to.y}`;
          case "line-to":
            return `L ${pathCommand.to.x} ${pathCommand.to.y}`;
          case "cubic-bezier-curve":
            return `C ${pathCommand.startControlPoint.x} ${pathCommand.startControlPoint.y} ${pathCommand.endControlPoint.x} ${pathCommand.endControlPoint.y} ${pathCommand.to.x} ${pathCommand.to.y}`;
          case "quadratic-bezier-curve":
            return `Q ${pathCommand.controlPoint.x} ${pathCommand.controlPoint.y} ${pathCommand.to.x} ${pathCommand.to.y}`;
          case "close-path":
            return "Z";
          default:
            pathCommand satisfies never;
            throw new Error("Unreachable");
        }
      })
      .join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${sentenceStructureDiagramData.canvas.width} ${sentenceStructureDiagramData.canvas.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      {sentenceStructureDiagramData.highlights.map((highlight) =>
        highlight.lineRectangles.map((lineRectangle, index) => (
          <rect
            key={`${highlight.sentenceStructureElementId}-${index}`}
            x={lineRectangle.x}
            y={lineRectangle.y}
            width={lineRectangle.width}
            height={lineRectangle.height}
            fill={highlight.style.backgroundColor}
          />
        )),
      )}

      {sentenceStructureDiagramData.words.map((word) => {
        const wordIndex =
          sentenceStructureDocument.sentences
            .find((sentence) => sentence.id === word.sentenceId)
            ?.words.find((candidateWord) => candidateWord.id === word.wordId)
            ?.index ?? null;
        if (wordIndex === null) {
          throw new Error("Word not found");
        }

        const isWithinSpanSelectingSpan =
          (interactionState.type ===
            "sentence-structure-element-span-selecting" ||
            interactionState.type === "modification-modified-span-selecting" ||
            interactionState.type === "coordination-part-span-selecting") &&
          word.sentenceId === interactionState.sentenceId &&
          Math.min(
            interactionState.anchorWordIndex,
            interactionState.focusWordIndex,
          ) <= wordIndex &&
          wordIndex <=
            Math.max(
              interactionState.anchorWordIndex,
              interactionState.focusWordIndex,
            );
        const isWithinTypeSelectingSpan =
          (interactionState.type === "span-action-selecting" ||
            interactionState.type ===
              "sentence-structure-element-usage-selecting" ||
            interactionState.type === "coordination-part-type-selecting") &&
          word.sentenceId === interactionState.sentenceId &&
          interactionState.startWordIndex <= wordIndex &&
          wordIndex <= interactionState.endWordIndex;
        const isWithinSelectedSpan = (() => {
          if (interactionState.type === "sentence-structure-element-selected") {
            if (interactionState.sentenceId !== word.sentenceId) {
              return false;
            }

            const selectedSentenceStructureElement =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.sentenceStructureElements.find(
                  (sentenceStructureElement) =>
                    sentenceStructureElement.id ===
                    interactionState.sentenceStructureElementId,
                );
            if (!selectedSentenceStructureElement) {
              throw new Error("Sentence structure element not found");
            }
            const startWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === selectedSentenceStructureElement.startWordId,
                )?.index ?? null;
            if (startWordIndex === null) {
              throw new Error("Start word not found");
            }
            const endWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === selectedSentenceStructureElement.endWordId,
                )?.index ?? null;
            if (endWordIndex === null) {
              throw new Error("End word not found");
            }
            return startWordIndex <= wordIndex && wordIndex <= endWordIndex;
          }

          if (
            interactionState.type === "modification-modifier-selected" ||
            interactionState.type === "modification-modified-span-selecting"
          ) {
            if (interactionState.sentenceId !== word.sentenceId) {
              return false;
            }

            return (
              interactionState.modifierSentenceStructureElement
                .startWordIndex <= wordIndex &&
              wordIndex <=
                interactionState.modifierSentenceStructureElement.endWordIndex
            );
          }

          if (interactionState.type === "modification-selected") {
            if (interactionState.sentenceId !== word.sentenceId) {
              return false;
            }

            const selectedModification = sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.modifications.find(
                (modification) =>
                  modification.id === interactionState.modificationId,
              );
            if (!selectedModification) {
              throw new Error("Modification not found");
            }
            const modifierSentenceStructureElement =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.sentenceStructureElements.find(
                  (sentenceStructureElement) =>
                    sentenceStructureElement.id ===
                    selectedModification.modifierSentenceStructureElementId,
                );
            if (!modifierSentenceStructureElement) {
              throw new Error("Modifier sentence structure element not found");
            }
            const modifiedSentenceStructureElement =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.sentenceStructureElements.find(
                  (sentenceStructureElement) =>
                    sentenceStructureElement.id ===
                    selectedModification.modifiedSentenceStructureElementId,
                );
            if (!modifiedSentenceStructureElement) {
              throw new Error("Modified sentence structure element not found");
            }
            const modifierStartWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === modifierSentenceStructureElement.startWordId,
                )?.index ?? null;
            if (modifierStartWordIndex === null) {
              throw new Error("Modifier start word not found");
            }
            const modifierEndWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === modifierSentenceStructureElement.endWordId,
                )?.index ?? null;
            if (modifierEndWordIndex === null) {
              throw new Error("Modifier end word not found");
            }
            const modifiedStartWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === modifiedSentenceStructureElement.startWordId,
                )?.index ?? null;
            if (modifiedStartWordIndex === null) {
              throw new Error("Modified start word not found");
            }
            const modifiedEndWordIndex =
              sentenceStructureDocument.sentences
                .find((sentence) => sentence.id === interactionState.sentenceId)
                ?.words.find(
                  (word) =>
                    word.id === modifiedSentenceStructureElement.endWordId,
                )?.index ?? null;
            if (modifiedEndWordIndex === null) {
              throw new Error("Modified end word not found");
            }
            return (
              (modifierStartWordIndex <= wordIndex &&
                wordIndex <= modifierEndWordIndex) ||
              (modifiedStartWordIndex <= wordIndex &&
                wordIndex <= modifiedEndWordIndex)
            );
          }

          if (
            interactionState.type === "coordination-parts-selected" ||
            interactionState.type === "coordination-part-span-selecting" ||
            interactionState.type === "coordination-part-type-selecting"
          ) {
            if (interactionState.sentenceId !== word.sentenceId) {
              return false;
            }

            return interactionState.coordinationParts.some(
              (coordinationPart) =>
                coordinationPart.startWordIndex <= wordIndex &&
                wordIndex <= coordinationPart.endWordIndex,
            );
          }

          if (interactionState.type === "coordination-selected") {
            if (interactionState.sentenceId !== word.sentenceId) {
              return false;
            }

            const selectedCoordination = sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.coordinations.find(
                (coordination) =>
                  coordination.id === interactionState.coordinationId,
              );
            if (!selectedCoordination) {
              throw new Error("Coordination not found");
            }
            return selectedCoordination.parts.some((coordinationPart) => {
              const startWordIndex =
                sentenceStructureDocument.sentences
                  .find(
                    (sentence) => sentence.id === interactionState.sentenceId,
                  )
                  ?.words.find(
                    (word) => word.id === coordinationPart.startWordId,
                  )?.index ?? null;
              if (startWordIndex === null) {
                throw new Error("Coordination part start word not found");
              }
              const endWordIndex =
                sentenceStructureDocument.sentences
                  .find(
                    (sentence) => sentence.id === interactionState.sentenceId,
                  )
                  ?.words.find((word) => word.id === coordinationPart.endWordId)
                  ?.index ?? null;
              if (endWordIndex === null) {
                throw new Error("Coordination part end word not found");
              }
              return startWordIndex <= wordIndex && wordIndex <= endWordIndex;
            });
          }
        })();

        return (
          <g
            key={word.wordId}
            onMouseDown={() => {
              const result = handlePointerDownOnWord({
                sentenceId: word.sentenceId,
                wordIndex: wordIndex,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            onMouseEnter={(e) => {
              if (e.buttons !== 1) return;
              const result = handlePointerEnterOnWord({
                sentenceId: word.sentenceId,
                wordIndex: wordIndex,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            onMouseUp={(e) => {
              e.stopPropagation();
              const result = handlePointerUpOnWord({
                sentenceId: word.sentenceId,
                wordIndex: wordIndex,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{
              userSelect: "none",
              cursor: "pointer",
            }}
          >
            <rect
              x={word.rectangle.x - 8}
              y={word.rectangle.y - 8}
              width={word.rectangle.width + 16}
              height={word.rectangle.height + 16}
              rx={8}
              ry={8}
              fill={
                isWithinSpanSelectingSpan
                  ? alpha(
                      theme.palette.primary.main,
                      theme.palette.action.selectedOpacity,
                    )
                  : isWithinTypeSelectingSpan || isWithinSelectedSpan
                    ? alpha(
                        theme.palette.primary.main,
                        theme.palette.action.focusOpacity,
                      )
                    : "transparent"
              }
            />
            <text
              key={word.wordId}
              x={word.rectangle.x}
              y={word.rectangle.y}
              dominantBaseline="text-before-edge"
              fontSize={word.style.fontSize}
              fontWeight={word.style.fontWeight}
              fill={word.style.textColor}
              fontFamily="system-ui"
            >
              {word.text}
            </text>
          </g>
        );
      })}

      {sentenceStructureDiagramData.underlines.map((underline) =>
        underline.lineSegments.map((lineSegment, index) => (
          <line
            key={`${underline.sentenceStructureElementId}-${index}`}
            x1={lineSegment.x1}
            x2={lineSegment.x2}
            y1={lineSegment.y}
            y2={lineSegment.y}
            stroke={underline.style.strokeColor}
            {...(underline.style.strokeStyle === "dashed" && {
              strokeDasharray: "4",
            })}
            strokeWidth={underline.style.strokeWidth}
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: underline.sentenceId,
                sentenceStructureElementId:
                  underline.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          />
        )),
      )}

      {sentenceStructureDiagramData.brackets.map((bracket) => (
        <Fragment key={bracket.sentenceStructureElementId}>
          <text
            x={bracket.openingBracket.x}
            y={bracket.openingBracket.y}
            dominantBaseline="text-before-edge"
            fontSize={bracket.style.fontSize}
            fontWeight={bracket.style.fontWeight}
            fill={bracket.style.textColor}
            fontFamily="system-ui"
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: bracket.sentenceId,
                sentenceStructureElementId: bracket.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {bracket.openingBracket.text}
          </text>
          <text
            x={bracket.closingBracket.x}
            y={bracket.closingBracket.y}
            dominantBaseline="text-before-edge"
            fontSize={bracket.style.fontSize}
            fontWeight={bracket.style.fontWeight}
            fill={bracket.style.textColor}
            fontFamily="system-ui"
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: bracket.sentenceId,
                sentenceStructureElementId: bracket.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {bracket.closingBracket.text}
          </text>
        </Fragment>
      ))}

      {sentenceStructureDiagramData.boxes.map((box) =>
        box.linePaths.map((linePath, index) => (
          <path
            key={`${box.sentenceStructureElementId}-${index}`}
            d={pathCommandsToSVGPathData(linePath.pathCommands)}
            stroke={box.style.strokeColor}
            {...(box.style.strokeStyle === "dashed" && {
              strokeDasharray: "4",
            })}
            strokeWidth={box.style.strokeWidth}
            fill="none"
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: box.sentenceId,
                sentenceStructureElementId: box.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          />
        )),
      )}

      {sentenceStructureDiagramData.sentenceElementLabels.map(
        (sentenceElementLabel) => (
          <text
            key={sentenceElementLabel.sentenceStructureElementId}
            x={sentenceElementLabel.x}
            y={sentenceElementLabel.y}
            textAnchor={
              sentenceElementLabel.anchorX === "left" ? "start" : "middle"
            }
            dominantBaseline={
              sentenceElementLabel.anchorY === "top"
                ? "text-before-edge"
                : "text-after-edge"
            }
            fontSize={sentenceElementLabel.style.fontSize}
            fontWeight={sentenceElementLabel.style.fontWeight}
            fill={sentenceElementLabel.style.textColor}
            fontFamily="system-ui"
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: sentenceElementLabel.sentenceId,
                sentenceStructureElementId:
                  sentenceElementLabel.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {sentenceElementLabel.text}
          </text>
        ),
      )}

      {sentenceStructureDiagramData.sentenceConstituentLabels.map(
        (sentenceConstituentLabel) => (
          <text
            key={sentenceConstituentLabel.sentenceStructureElementId}
            x={sentenceConstituentLabel.x}
            y={sentenceConstituentLabel.y}
            textAnchor={
              sentenceConstituentLabel.anchorX === "left" ? "start" : "middle"
            }
            dominantBaseline={
              sentenceConstituentLabel.anchorY === "top"
                ? "text-before-edge"
                : "text-after-edge"
            }
            fontSize={sentenceConstituentLabel.style.fontSize}
            fontWeight={sentenceConstituentLabel.style.fontWeight}
            fill={sentenceConstituentLabel.style.textColor}
            fontFamily="system-ui"
            onClick={() => {
              const result = handleSelectSentenceStructureElement({
                sentenceId: sentenceConstituentLabel.sentenceId,
                sentenceStructureElementId:
                  sentenceConstituentLabel.sentenceStructureElementId,
              });
              if (!result.success) {
                alert(result.message);
              }
            }}
            style={{ cursor: "pointer" }}
          >
            {sentenceConstituentLabel.text}
          </text>
        ),
      )}

      {sentenceStructureDiagramData.arrows.map((arrow) => (
        <path
          key={arrow.modificationId}
          d={pathCommandsToSVGPathData(arrow.pathCommands)}
          stroke={arrow.style.strokeColor}
          {...(arrow.style.strokeStyle === "dashed" && {
            strokeDasharray: "4",
          })}
          strokeWidth={arrow.style.strokeWidth}
          fill="none"
          onClick={() => {
            const result = handleSelectModification({
              sentenceId: arrow.sentenceId,
              modificationId: arrow.modificationId,
            });
            if (!result.success) {
              alert(result.message);
            }
          }}
          style={{ cursor: "pointer" }}
        />
      ))}

      {sentenceStructureDiagramData.coordinationGroupIndicators.map(
        (coordinationGroupIndicator) =>
          coordinationGroupIndicator.linePaths.map((linePath, index) => (
            <path
              key={`${coordinationGroupIndicator.coordinationId}-${index}`}
              d={pathCommandsToSVGPathData(linePath.pathCommands)}
              stroke={coordinationGroupIndicator.style.strokeColor}
              {...(coordinationGroupIndicator.style.strokeStyle ===
                "dashed" && {
                strokeDasharray: "4",
              })}
              strokeWidth={coordinationGroupIndicator.style.strokeWidth}
              fill="none"
              onClick={() => {
                const result = handleSelectCoordination({
                  sentenceId: coordinationGroupIndicator.sentenceId,
                  coordinationId: coordinationGroupIndicator.coordinationId,
                });
                if (!result.success) {
                  alert(result.message);
                }
              }}
              style={{ cursor: "pointer" }}
            />
          )),
      )}
    </svg>
  );
}
