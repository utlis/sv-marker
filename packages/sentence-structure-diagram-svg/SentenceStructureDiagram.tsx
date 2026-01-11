import { Fragment } from "react";
import {
  sentenceStructureDataToXMLString,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import {
  xmlStringToConfigurations,
  type Configurations,
} from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import { convertSentenceStructureDataToSentenceStructureDiagramData } from "@sentence-structure-diagram-app/sentence-structure-diagram-data";

type SentenceStructureDiagramProps = {
  sentenceStructureData: SentenceStructureData;
  maxWidth: number;
  measureTextWidth: (text: string) => number;
  configurations: Configurations;
};

export default function SentenceStructureDiagram(
  props: SentenceStructureDiagramProps,
) {
  const sentenceStructureDiagramData =
    convertSentenceStructureDataToSentenceStructureDiagramData(
      props.sentenceStructureData,
      props.maxWidth,
      props.measureTextWidth,
      props.configurations,
    );
  return (
    <svg
      width="100%"
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${sentenceStructureDiagramData.position.right} ${sentenceStructureDiagramData.position.bottom}`}
    >
      <metadata
        dangerouslySetInnerHTML={{
          __html: `\
<sentence-structure-data
  xmlns="https://chvmvd.github.io/sentence-structure-diagram-app/"
  version="0.1.0"
>
  ${sentenceStructureDataToXMLString(props.sentenceStructureData)}
</sentence-structure-data>
<configurations
  xmlns="https://chvmvd.github.io/sentence-structure-diagram-app/"
  version="0.1.0"
>
  ${xmlStringToConfigurations.encode(props.configurations)}
</configurations>
`,
        }}
      ></metadata>
      {/* 単語と括弧類 */}
      {sentenceStructureDiagramData.words.map((word) => (
        <Fragment key={word.index}>
          {word.openingBrackets.length > 0 && (
            <text
              x={word.position.left}
              y={word.position.bottom}
              textAnchor="end"
              fill={sentenceStructureDiagramData.color.primaryColor}
              fontFamily="system-ui"
            >
              {word.openingBrackets.join("")}
            </text>
          )}
          <text
            x={word.position.left}
            y={word.position.bottom}
            textAnchor="start"
            fill={sentenceStructureDiagramData.color.textColor}
            fontFamily="system-ui"
          >
            {word.text}
          </text>
          {word.closingBrackets.length > 0 && (
            <text
              x={word.position.right}
              y={word.position.bottom}
              textAnchor="start"
              fill={sentenceStructureDiagramData.color.primaryColor}
              fontFamily="system-ui"
            >
              {word.closingBrackets.join("")}
            </text>
          )}
        </Fragment>
      ))}
      {/* 下線 */}
      {sentenceStructureDiagramData.underlines.map((underline) =>
        underline.position.map((position, index) => (
          <line
            key={`${underline.rangeId}-${index}`}
            x1={position.start}
            x2={position.end}
            y1={position.bottom}
            y2={position.bottom}
            stroke={sentenceStructureDiagramData.color.primaryColor}
            strokeWidth={2}
          />
        )),
      )}
      {/* 文の要素の記号 */}
      {sentenceStructureDiagramData.sentenceElements.map(
        (sentenceElement) =>
          sentenceElement.symbol && (
            <text
              key={sentenceElement.rangeId}
              x={sentenceElement.position.x}
              y={sentenceElement.position.y}
              textAnchor="middle"
              fill={sentenceStructureDiagramData.color.primaryColor}
              fontFamily="system-ui"
              dominantBaseline="hanging"
            >
              {sentenceElement.symbol}
            </text>
          ),
      )}
      {/* 矢印 */}
      {sentenceStructureDiagramData.relations.map((relation) => (
        <path
          key={relation.relationId}
          d={relation.svgPathData}
          fill="none"
          stroke={sentenceStructureDiagramData.color.primaryColor}
          strokeWidth={2}
        />
      ))}
      {/* 並列 */}
      {sentenceStructureDiagramData.coordinations.map((coordination) => (
        <path
          key={coordination.coordinationId}
          d={coordination.svgPathData}
          fill="none"
          stroke={sentenceStructureDiagramData.color.primaryColor}
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}
