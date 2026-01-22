import type {
  CoordinationPart,
  Modification,
  SentenceStructureDecoratedDocumentCoordinationNode,
  SentenceStructureDecoratedDocumentCoordinationPartNode,
  SentenceStructureDecoratedDocumentForest,
  SentenceStructureDecoratedDocumentNode,
  SentenceStructureDecoratedDocumentRootNode,
  SentenceStructureDecoratedDocumentSentenceStructureElementNode,
  SentenceStructureDecoratedDocumentSentenceTree,
  SentenceStructureDecoratedDocumentWordNode,
  SentenceStructureElement,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import type {
  HexRGBColor,
  SentenceStructureDiagramNotation,
} from "@sentence-structure-diagram-app/sentence-structure-diagram-notation";
import type {
  BackgroundStyle,
  StrokeStyle,
  SentenceStructureDiagramModelCoordinationNode,
  SentenceStructureDiagramModelCoordinationPartNode,
  SentenceStructureDiagramModelForest,
  SentenceStructureDiagramModelModification,
  SentenceStructureDiagramModelNode,
  SentenceStructureDiagramModelRootNode,
  SentenceStructureDiagramModelSentenceStructureElementNode,
  SentenceStructureDiagramModelSentenceTree,
  SentenceStructureDiagramModelWordNode,
  TextStyle,
} from "./types.js";

function resolveRangeMarker(
  range:
    | {
        type: "sentence-structure-element";
        sentenceStructureElement: SentenceStructureElement;
      }
    | {
        type: "coordination-part";
        coordinationPart: CoordinationPart;
      },
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
):
  | {
      type: "underline";
      style: StrokeStyle;
    }
  | {
      type: "bracket";
      openingBracket: string;
      closingBracket: string;
      style: TextStyle;
    }
  | {
      type: "box";
      style: StrokeStyle;
    }
  | {
      type: "text-emphasis";
      style: {
        textColor: HexRGBColor;
      };
    }
  | {
      type: "highlight";
      style: BackgroundStyle;
    }
  | {
      type: "bold";
    }
  | null {
  const rangeMarker = (() => {
    switch (range.type) {
      case "sentence-structure-element":
        switch (range.sentenceStructureElement.kind) {
          case "core-sentence-element":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.rangeMarking
              .coreSentenceElement;
          case "sentence-constituent":
            switch (range.sentenceStructureElement.type) {
              case "phrase":
                switch (range.sentenceStructureElement.usage) {
                  case "nominal":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.phrase.nominal;
                  case "adjectival":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.phrase.adjectival;
                  case "adverbial":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.phrase.adverbial;
                  default:
                    range.sentenceStructureElement.usage satisfies never;
                    throw new Error("Unreachable");
                }
              case "clause":
                switch (range.sentenceStructureElement.usage) {
                  case "nominal":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.clause.nominal;
                  case "adjectival":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.clause.adjectival;
                  case "adverbial":
                    return sentenceStructureDiagramNotation
                      .sentenceStructureElementNotation.rangeMarking
                      .sentenceConstituent.clause.adverbial;
                  default:
                    range.sentenceStructureElement.usage satisfies never;
                    throw new Error("Unreachable");
                }
              case "adverbial-phrase":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.rangeMarking
                  .sentenceConstituent.adverbialPhrase;
              default:
                range.sentenceStructureElement satisfies never;
                throw new Error("Unreachable");
            }
          case "modification-element":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.rangeMarking
              .modificationElement;
          default:
            range.sentenceStructureElement satisfies never;
            throw new Error("Unreachable");
        }
      case "coordination-part":
        switch (range.coordinationPart.type) {
          case "coordinator":
            return sentenceStructureDiagramNotation.coordinationNotation
              .rangeMarking.coordinator;
          case "correlative":
            return sentenceStructureDiagramNotation.coordinationNotation
              .rangeMarking.correlative;
          case "conjunct":
            return sentenceStructureDiagramNotation.coordinationNotation
              .rangeMarking.conjunct;
          default:
            range.coordinationPart.type satisfies never;
            throw new Error("Unreachable");
        }
      default:
        range satisfies never;
        throw new Error("Unreachable");
    }
  })();

  switch (rangeMarker.type) {
    case "underline":
      return {
        type: "underline",
        style: {
          strokeStyle: rangeMarker.lineStyle,
          strokeColor:
            sentenceStructureDiagramNotation.theme.colors[rangeMarker.color],
        },
      };
    case "bracket":
      const bracketSymbols = (() => {
        switch (rangeMarker.bracketType) {
          case "parenthesis":
            return { openingBracket: "(", closingBracket: ")" };
          case "angle-bracket":
            return { openingBracket: "<", closingBracket: ">" };
          case "curly-bracket":
            return { openingBracket: "{", closingBracket: "}" };
          case "square-bracket":
            return { openingBracket: "[", closingBracket: "]" };
          default:
            rangeMarker.bracketType satisfies never;
            throw new Error("Unreachable");
        }
      })();
      return {
        type: "bracket",
        openingBracket: bracketSymbols.openingBracket,
        closingBracket: bracketSymbols.closingBracket,
        style: {
          fontSize: sentenceStructureDiagramNotation.theme.typography.fontSize,
          fontWeight: "normal",
          textColor:
            sentenceStructureDiagramNotation.theme.colors[rangeMarker.color],
        },
      };
    case "box":
      return {
        type: "box",
        style: {
          strokeStyle: "solid",
          strokeColor:
            sentenceStructureDiagramNotation.theme.colors[rangeMarker.color],
        },
      };
    case "text-emphasis":
      return {
        type: "text-emphasis",
        style: {
          textColor:
            sentenceStructureDiagramNotation.theme.colors[rangeMarker.color],
        },
      };
    case "highlight":
      return {
        type: "highlight",
        style: {
          backgroundColor:
            sentenceStructureDiagramNotation.theme.colors[rangeMarker.color],
        },
      };
    case "bold":
      return {
        type: "bold",
      };
    case "none":
      return null;
    default:
      rangeMarker satisfies never;
      throw new Error("Unreachable");
  }
}

function toSubscriptDigits(number: number): string {
  return String(number).replace(/\d/g, (digit) => {
    switch (digit) {
      case "0":
        return "₀";
      case "1":
        return "₁";
      case "2":
        return "₂";
      case "3":
        return "₃";
      case "4":
        return "₄";
      case "5":
        return "₅";
      case "6":
        return "₆";
      case "7":
        return "₇";
      case "8":
        return "₈";
      case "9":
        return "₉";
      default:
        throw new Error("Unreachable");
    }
  });
}

function resolveSentenceElementLabel(
  sentenceStructureElement: SentenceStructureElement,
  nestingDepth: number,
  conjunctOrdinalPath: number[],
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): {
  text: string;
  placement: "below-center" | "below-left" | "above-center" | "above-left";
  style: TextStyle;
} | null {
  if (
    sentenceStructureElement.kind === "modification-element" ||
    !sentenceStructureElement.sentenceElementName
  ) {
    return null;
  }

  const sentenceElementLabel = (() => {
    switch (sentenceStructureElement.sentenceElementName) {
      case "S":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.labels.S;
      case "V":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.labels.V;
      case "O":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.labels.O;
      case "C":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.labels.C;
      case "M":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.labels.M;
      default:
        sentenceStructureElement.sentenceElementName satisfies never;
        throw new Error("Unreachable");
    }
  })();

  if (sentenceElementLabel === "") {
    return null;
  }

  const sentenceElementLabelWithSuffixes = (() => {
    const sentenceElementLabelWithNestingDepthPrimes =
      sentenceElementLabel +
      (sentenceStructureDiagramNotation.sentenceStructureElementNotation
        .sentenceElementLabeling.labelSuffixes.showNestingDepthPrimes
        ? "′".repeat(nestingDepth)
        : "");
    return (
      sentenceElementLabelWithNestingDepthPrimes +
      (sentenceStructureDiagramNotation.sentenceStructureElementNotation
        .sentenceElementLabeling.labelSuffixes.showConjunctNumbering
        ? conjunctOrdinalPath
            .map((ordinal) => toSubscriptDigits(ordinal))
            .join("-")
        : "")
    );
  })();

  const sentenceElementPlacement = (() => {
    switch (sentenceStructureElement.kind) {
      case "core-sentence-element":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceElementLabeling.placement.coreSentenceElement;
      case "sentence-constituent":
        switch (sentenceStructureElement.type) {
          case "phrase":
            switch (sentenceStructureElement.usage) {
              case "nominal":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.phrase.nominal;
              case "adjectival":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.phrase.adjectival;
              case "adverbial":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.phrase.adverbial;
              default:
                sentenceStructureElement.usage satisfies never;
                throw new Error("Unreachable");
            }
          case "clause":
            switch (sentenceStructureElement.usage) {
              case "nominal":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.clause.nominal;
              case "adjectival":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.clause.adjectival;
              case "adverbial":
                return sentenceStructureDiagramNotation
                  .sentenceStructureElementNotation.sentenceElementLabeling
                  .placement.sentenceConstituent.clause.adverbial;
              default:
                sentenceStructureElement.usage satisfies never;
                throw new Error("Unreachable");
            }
          case "adverbial-phrase":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceElementLabeling
              .placement.sentenceConstituent.adverbialPhrase;
          default:
            sentenceStructureElement satisfies never;
            throw new Error("Unreachable");
        }
      default:
        sentenceStructureElement satisfies never;
        throw new Error("Unreachable");
    }
  })();

  return {
    text: sentenceElementLabelWithSuffixes,
    placement: sentenceElementPlacement,
    style: {
      fontSize: sentenceStructureDiagramNotation.theme.typography.fontSize,
      fontWeight: "normal",
      textColor:
        sentenceStructureDiagramNotation.theme.colors[
          sentenceStructureDiagramNotation.sentenceStructureElementNotation
            .sentenceElementLabeling.color
        ],
    },
  };
}

function resolveSentenceConstituentLabel(
  sentenceStructureElement: SentenceStructureElement,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): {
  text: string;
  placement: "below-center" | "below-left" | "above-center" | "above-left";
  style: TextStyle;
} | null {
  if (sentenceStructureElement.kind !== "sentence-constituent") {
    return null;
  }

  const sentenceConstituentLabel = (() => {
    switch (sentenceStructureElement.type) {
      case "phrase":
        switch (sentenceStructureElement.usage) {
          case "nominal":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.phrase.nominal;
          case "adjectival":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.phrase.adjectival;
          case "adverbial":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.phrase.adverbial;
          default:
            sentenceStructureElement.usage satisfies never;
            throw new Error("Unreachable");
        }
      case "clause":
        switch (sentenceStructureElement.usage) {
          case "nominal":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.clause.nominal;
          case "adjectival":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.clause.adjectival;
          case "adverbial":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .labels.clause.adverbial;
          default:
            sentenceStructureElement.usage satisfies never;
            throw new Error("Unreachable");
        }
      case "adverbial-phrase":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceConstituentLabeling.labels.adverbialPhrase;
      default:
        sentenceStructureElement satisfies never;
        throw new Error("Unreachable");
    }
  })();

  if (sentenceConstituentLabel === "") {
    return null;
  }

  const sentenceConstituentPlacement = (() => {
    switch (sentenceStructureElement.type) {
      case "phrase":
        switch (sentenceStructureElement.usage) {
          case "nominal":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.phrase.nominal;
          case "adjectival":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.phrase.adjectival;
          case "adverbial":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.phrase.adverbial;
          default:
            sentenceStructureElement.usage satisfies never;
            throw new Error("Unreachable");
        }
      case "clause":
        switch (sentenceStructureElement.usage) {
          case "nominal":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.clause.nominal;
          case "adjectival":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.clause.adjectival;
          case "adverbial":
            return sentenceStructureDiagramNotation
              .sentenceStructureElementNotation.sentenceConstituentLabeling
              .placement.clause.adverbial;
          default:
            sentenceStructureElement.usage satisfies never;
            throw new Error("Unreachable");
        }
      case "adverbial-phrase":
        return sentenceStructureDiagramNotation.sentenceStructureElementNotation
          .sentenceConstituentLabeling.placement.adverbialPhrase;
      default:
        sentenceStructureElement satisfies never;
        throw new Error("Unreachable");
    }
  })();

  return {
    text: sentenceConstituentLabel,
    placement: sentenceConstituentPlacement,
    style: {
      fontSize: sentenceStructureDiagramNotation.theme.typography.fontSize,
      fontWeight: "normal",
      textColor:
        sentenceStructureDiagramNotation.theme.colors[
          sentenceStructureDiagramNotation.sentenceStructureElementNotation
            .sentenceConstituentLabeling.color
        ],
    },
  };
}

function resolveCoordinationGroupIndicator(
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation & {
    coordinationNotation: {
      layout: {
        direction: "horizontal";
      };
    };
  },
): {
  type: "bus-connector";
  style: StrokeStyle;
} | null;
function resolveCoordinationGroupIndicator(
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation & {
    coordinationNotation: {
      layout: {
        direction: "vertical";
      };
    };
  },
):
  | {
      type: "bracket";
      bracketType:
        | "parenthesis"
        | "angle-bracket"
        | "curly-bracket"
        | "square-bracket";
      placement: "left" | "both-sides";
      style: StrokeStyle;
    }
  | {
      type: "bus-connector";
      style: StrokeStyle;
    }
  | null;
function resolveCoordinationGroupIndicator(
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
):
  | {
      type: "bracket";
      bracketType:
        | "parenthesis"
        | "angle-bracket"
        | "curly-bracket"
        | "square-bracket";
      placement: "left" | "both-sides";
      style: StrokeStyle;
    }
  | {
      type: "bus-connector";
      style: StrokeStyle;
    }
  | null {
  switch (
    sentenceStructureDiagramNotation.coordinationNotation.groupIndicator.type
  ) {
    case "bracket":
      return {
        type: "bracket",
        bracketType:
          sentenceStructureDiagramNotation.coordinationNotation.groupIndicator
            .bracketType,
        placement:
          sentenceStructureDiagramNotation.coordinationNotation.groupIndicator
            .placement,
        style: {
          strokeStyle: "solid",
          strokeColor:
            sentenceStructureDiagramNotation.theme.colors[
              sentenceStructureDiagramNotation.coordinationNotation
                .groupIndicator.color
            ],
        },
      };
    case "bus-connector":
      return {
        type: "bus-connector",
        style: {
          strokeStyle: "solid",
          strokeColor:
            sentenceStructureDiagramNotation.theme.colors[
              sentenceStructureDiagramNotation.coordinationNotation
                .groupIndicator.color
            ],
        },
      };
    case "none":
      return null;
    default:
      sentenceStructureDiagramNotation.coordinationNotation
        .groupIndicator satisfies never;
      throw new Error("Unreachable");
  }
}

function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentWordNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelWordNode;
function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentSentenceStructureElementNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelSentenceStructureElementNode;
function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentCoordinationPartNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelCoordinationPartNode;
function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentCoordinationNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelCoordinationNode;
function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentRootNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelRootNode;
function createSentenceStructureDiagramModelNode(
  sentenceStructureDecoratedDocumentNode: SentenceStructureDecoratedDocumentNode,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
  textStyleOverride?: Partial<TextStyle>,
): SentenceStructureDiagramModelNode {
  switch (sentenceStructureDecoratedDocumentNode.type) {
    case "word":
      return {
        type: "word",
        id: sentenceStructureDecoratedDocumentNode.word.id,
        text: sentenceStructureDecoratedDocumentNode.word.text,
        whitespaceAfter:
          sentenceStructureDecoratedDocumentNode.word.whitespaceAfter,
        style: {
          fontSize: sentenceStructureDiagramNotation.theme.typography.fontSize,
          fontWeight: textStyleOverride?.fontWeight ?? "normal",
          textColor:
            textStyleOverride?.textColor ??
            sentenceStructureDiagramNotation.theme.colors.text,
        },
      };
    case "sentence-structure-element": {
      const rangeMarker = resolveRangeMarker(
        {
          type: "sentence-structure-element",
          sentenceStructureElement:
            sentenceStructureDecoratedDocumentNode.sentenceStructureElement,
        },
        sentenceStructureDiagramNotation,
      );

      return {
        type: "sentence-structure-element",
        id: sentenceStructureDecoratedDocumentNode.sentenceStructureElement.id,
        rangeMarker:
          rangeMarker &&
          rangeMarker.type !== "text-emphasis" &&
          rangeMarker.type !== "bold"
            ? rangeMarker
            : null,
        sentenceElementLabel: resolveSentenceElementLabel(
          sentenceStructureDecoratedDocumentNode.sentenceStructureElement,
          sentenceStructureDecoratedDocumentNode.nestingDepth,
          sentenceStructureDecoratedDocumentNode.conjunctOrdinalPath,
          sentenceStructureDiagramNotation,
        ),
        sentenceConstituentLabel: resolveSentenceConstituentLabel(
          sentenceStructureDecoratedDocumentNode.sentenceStructureElement,
          sentenceStructureDiagramNotation,
        ),
        children: sentenceStructureDecoratedDocumentNode.children.map(
          (child) => {
            switch (child.type) {
              case "word":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              case "sentence-structure-element":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              case "coordination":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              default:
                child satisfies never;
                throw new Error("Unreachable");
            }
          },
        ),
      };
    }
    case "coordination-part": {
      const rangeMarker = resolveRangeMarker(
        {
          type: "coordination-part",
          coordinationPart:
            sentenceStructureDecoratedDocumentNode.coordinationPart,
        },
        sentenceStructureDiagramNotation,
      );

      return {
        type: "coordination-part",
        id: sentenceStructureDecoratedDocumentNode.coordinationPart.id,
        rangeMarker:
          rangeMarker &&
          rangeMarker.type !== "text-emphasis" &&
          rangeMarker.type !== "bold"
            ? rangeMarker
            : null,
        children: sentenceStructureDecoratedDocumentNode.children.map(
          (child) => {
            switch (child.type) {
              case "word":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              case "sentence-structure-element":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              case "coordination":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  {
                    ...textStyleOverride,
                    ...(rangeMarker?.type === "text-emphasis"
                      ? { textColor: rangeMarker.style.textColor }
                      : {}),
                    ...(rangeMarker?.type === "bold"
                      ? { fontWeight: "bold" }
                      : {}),
                  },
                );
              default:
                child satisfies never;
                throw new Error("Unreachable");
            }
          },
        ),
      };
    }
    case "coordination":
      return {
        type: "coordination",
        id: sentenceStructureDecoratedDocumentNode.coordination.id,
        children: sentenceStructureDecoratedDocumentNode.children.map(
          (child) => {
            switch (child.type) {
              case "coordination-part":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  textStyleOverride,
                );
              default:
                child.type satisfies never;
                throw new Error("Unreachable");
            }
          },
        ),
      };
    case "root":
      return {
        type: "root",
        children: sentenceStructureDecoratedDocumentNode.children.map(
          (child) => {
            switch (child.type) {
              case "word":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  textStyleOverride,
                );
              case "sentence-structure-element":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  textStyleOverride,
                );
              case "coordination":
                return createSentenceStructureDiagramModelNode(
                  child,
                  sentenceStructureDiagramNotation,
                  textStyleOverride,
                );
              default:
                child satisfies never;
                throw new Error("Unreachable");
            }
          },
        ),
      };
    default:
      sentenceStructureDecoratedDocumentNode satisfies never;
      throw new Error("Unreachable");
  }
}

function createSentenceStructureDiagramModelModification(
  modification: Modification,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): SentenceStructureDiagramModelModification {
  return {
    id: modification.id,
    modifierSentenceStructureElementNodeId:
      modification.modifierSentenceStructureElementId,
    modifiedSentenceStructureElementNodeId:
      modification.modifiedSentenceStructureElementId,
    arrow: {
      type: sentenceStructureDiagramNotation.modificationNotation.arrow.type,
      style: {
        strokeStyle: "solid",
        strokeColor:
          sentenceStructureDiagramNotation.theme.colors[
            sentenceStructureDiagramNotation.modificationNotation.arrow.color
          ],
      },
    },
  };
}

function createSentenceStructureDiagramModelSentenceTree(
  sentenceStructureDecoratedDocumentSentenceTree: SentenceStructureDecoratedDocumentSentenceTree,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): SentenceStructureDiagramModelSentenceTree {
  return {
    id: sentenceStructureDecoratedDocumentSentenceTree.sentenceId,
    root: createSentenceStructureDiagramModelNode(
      sentenceStructureDecoratedDocumentSentenceTree.root,
      sentenceStructureDiagramNotation,
    ),
    modifications:
      sentenceStructureDecoratedDocumentSentenceTree.modifications.map(
        (modification) =>
          createSentenceStructureDiagramModelModification(
            modification,
            sentenceStructureDiagramNotation,
          ),
      ),
  };
}

export function createSentenceStructureDiagramModelForest(
  sentenceStructureDecoratedDocumentForest: SentenceStructureDecoratedDocumentForest,
  sentenceStructureDiagramNotation: SentenceStructureDiagramNotation,
): SentenceStructureDiagramModelForest {
  return {
    layoutSettings: !sentenceStructureDiagramNotation.enableReflow
      ? {
          canvas: sentenceStructureDiagramNotation.canvas,
          spacing: sentenceStructureDiagramNotation.theme.spacing,
          enableReflow: false,
          coordination: {
            layoutDirection:
              sentenceStructureDiagramNotation.coordinationNotation.layout
                .direction,
            groupIndicator: resolveCoordinationGroupIndicator(
              sentenceStructureDiagramNotation,
            ),
          },
        }
      : {
          canvas: sentenceStructureDiagramNotation.canvas,
          spacing: sentenceStructureDiagramNotation.theme.spacing,
          enableReflow: true,
          coordination: {
            layoutDirection:
              sentenceStructureDiagramNotation.coordinationNotation.layout
                .direction,
            groupIndicator: resolveCoordinationGroupIndicator(
              sentenceStructureDiagramNotation,
            ),
          },
          layoutStrategy: sentenceStructureDiagramNotation.layoutStrategy,
        },
    sentences: sentenceStructureDecoratedDocumentForest.sentences.map(
      (sentenceStructureDecoratedDocumentSentenceTree) =>
        createSentenceStructureDiagramModelSentenceTree(
          sentenceStructureDecoratedDocumentSentenceTree,
          sentenceStructureDiagramNotation,
        ),
    ),
  };
}
