import type { Configurations } from "./schema.js";

export const defaultConfigurations: Configurations = {
  color: {
    primaryColor: "#1976d2",
    textColor: "#000000",
  },
  sentenceStructureRangeTypeToBracketNameMap: {
    modifier: "(parenthesis)",
    phrase: "<angle-bracket>",
    clause: "[square-bracket]",
  },
  sentenceElementNameToSentenceElementSymbolMap: {
    S: "S",
    V: "V",
    C: "C",
    O: "O",
    M: "M",
  },
  sentenceElementPositionType: {
    sentenceElementRangeSentenceElementPositionType: "bottom-center",
    sentenceStructureRangeSentenceElementPositionType: "bottom-left",
  },
  relationShapeType: "curved",
  layoutMode: "structured",
};
