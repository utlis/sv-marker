import * as z from "zod";
import {
  sentenceElementNameOptions,
  sentenceStructureRangeTypeOptions,
} from "@sentence-structure-diagram-app/sentence-structure-data";

const BracketNameSchema = z.literal([
  "(parenthesis)",
  "<angle-bracket>",
  "{curly-bracket}",
  "[square-bracket]",
]);
export type BracketName = z.infer<typeof BracketNameSchema>;

const SentenceElementPositionTypeSchema = z.literal([
  "bottom-center",
  "bottom-left",
]);
export type SentenceElementPositionType = z.infer<
  typeof SentenceElementPositionTypeSchema
>;

const RelationShapeTypeSchema = z.literal(["curved", "right-angle"]);
export type RelationShapeType = z.infer<typeof RelationShapeTypeSchema>;

const LayoutModeSchema = z.literal(["linear", "structured"]);
export type LayoutMode = z.infer<typeof LayoutModeSchema>;

export const ConfigurationsSchema = z.object({
  color: z.object({
    primaryColor: z.string(),
    textColor: z.string(),
  }),
  sentenceStructureRangeTypeToBracketNameMap: z.record(
    z.literal(sentenceStructureRangeTypeOptions),
    BracketNameSchema,
  ),
  sentenceElementNameToSentenceElementSymbolMap: z.record(
    z.literal(sentenceElementNameOptions),
    z.string(),
  ),
  sentenceElementPositionType: z.object({
    sentenceElementRangeSentenceElementPositionType:
      SentenceElementPositionTypeSchema,
    sentenceStructureRangeSentenceElementPositionType:
      SentenceElementPositionTypeSchema,
  }),
  relationShapeType: RelationShapeTypeSchema,
  layoutMode: LayoutModeSchema,
});
export type Configurations = z.infer<typeof ConfigurationsSchema>;
