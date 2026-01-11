// import { readFileSync } from "node:fs";
// import jsonpatch from "fast-json-patch";
// import { type SimplifiedSentenceStructureData } from "@sentence-structure-diagram-app/sentence-structure-data";
// import type { Dataset, ModelName } from "./types.js";

// const modelName: ModelName = "gpt-5.1";

// const datasets: Dataset[] = JSON.parse(
//   readFileSync(`${import.meta.dirname}/data/datasets.json`, "utf-8"),
// );

// let differenceCount = 0;
// for (const dataset of datasets) {
//   const answerSimplifiedSentenceStructureData: SimplifiedSentenceStructureData =
//     JSON.parse(
//       readFileSync(
//         `${import.meta.dirname}/output/answer-${dataset.id}.json`,
//         "utf-8",
//       ),
//     );
//   const llmSimplifiedSentenceStructureData: SimplifiedSentenceStructureData =
//     JSON.parse(
//       readFileSync(
//         `${import.meta.dirname}/output/${modelName}-${dataset.id}.json`,
//         "utf-8",
//       ),
//     );

//   const differences = jsonpatch.compare(
//     answerSimplifiedSentenceStructureData,
//     llmSimplifiedSentenceStructureData,
//   );
//   differenceCount += differences.length;
//   console.log(
//     `Number of differences between answer and ${modelName} for dataset ID ${dataset.id}: ${differences.length}`,
//   );
// }
// console.log(
//   `Total number of differences between answer and ${modelName}: ${differenceCount}`,
// );
