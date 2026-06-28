import { Fragment } from "react/jsx-runtime";
import {
  sentenceStructureDocumentToXMLString,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { type SentenceStructureDiagramNotation } from "@sv-marker/sentence-structure-diagram-notation";
import type {
  PathCommand,
  SentenceStructureDiagramData,
} from "../diagram-data/types.js";

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

type SentenceStructureDiagramProps = {
  sentenceStructureDocument: SentenceStructureDocument;
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
  sentenceStructureDiagramData: SentenceStructureDiagramData;
};

export default function SentenceStructureDiagram(
  props: SentenceStructureDiagramProps,
) {
  return (
    <svg
      viewBox={`0 0 ${props.sentenceStructureDiagramData.canvas.width} ${props.sentenceStructureDiagramData.canvas.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <metadata
        dangerouslySetInnerHTML={{
          __html: `\
${sentenceStructureDocumentToXMLString(props.sentenceStructureDocument)}
`,
        }}
      />
      {props.sentenceStructureDiagramData.highlights.map((highlight) =>
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
      {props.sentenceStructureDiagramData.words.map((word) => (
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
      ))}
      {props.sentenceStructureDiagramData.underlines.map((underline) =>
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
          />
        )),
      )}
      {props.sentenceStructureDiagramData.brackets.map((bracket) => (
        <Fragment key={bracket.sentenceStructureElementId}>
          <text
            x={bracket.openingBracket.x}
            y={bracket.openingBracket.y}
            dominantBaseline="text-before-edge"
            fontSize={bracket.style.fontSize}
            fontWeight={bracket.style.fontWeight}
            fill={bracket.style.textColor}
            fontFamily="system-ui"
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
          >
            {bracket.closingBracket.text}
          </text>
        </Fragment>
      ))}
      {props.sentenceStructureDiagramData.boxes.map((box) =>
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
          />
        )),
      )}
      {props.sentenceStructureDiagramData.sentenceElementLabels.map(
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
          >
            {sentenceElementLabel.text}
          </text>
        ),
      )}
      {props.sentenceStructureDiagramData.sentenceConstituentLabels.map(
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
          >
            {sentenceConstituentLabel.text}
          </text>
        ),
      )}
      {props.sentenceStructureDiagramData.arrows.map((arrow) => (
        <path
          key={arrow.modificationId}
          d={pathCommandsToSVGPathData(arrow.pathCommands)}
          stroke={arrow.style.strokeColor}
          {...(arrow.style.strokeStyle === "dashed" && {
            strokeDasharray: "4",
          })}
          strokeWidth={arrow.style.strokeWidth}
          fill="none"
        />
      ))}
      {props.sentenceStructureDiagramData.coordinationGroupIndicators.map(
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
            />
          )),
      )}
    </svg>
  );
}
