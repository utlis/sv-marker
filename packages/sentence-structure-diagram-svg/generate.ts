import ReactDOMServer from "react-dom/server";
// import prettier from "prettier/standalone";
// import prettierPluginHtml from "prettier/plugins/html";
import type { SentenceStructureData } from "@sentence-structure-diagram-app/sentence-structure-data";
import type { Configurations } from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import SentenceStructureDiagram from "./SentenceStructureDiagram.js";

export function generateSvgString(
  sentenceStructureData: SentenceStructureData,
  maxWidth: number,
  measureTextWidth: (text: string) => number,
  configurations: Configurations,
): string {
  // return await prettier.format(
  return ReactDOMServer.renderToStaticMarkup(
    SentenceStructureDiagram({
      sentenceStructureData,
      maxWidth,
      measureTextWidth,
      configurations,
    }),
  );
  // {
  //   parser: "html",
  //   plugins: [prettierPluginHtml],
  // },
  // );
}
