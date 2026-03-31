import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  addCoordination,
  addModification,
  addSentenceStructureElement,
  deleteCoordination,
  deleteModification,
  deleteSentenceStructureElement,
  updateSentenceElementName,
  type CoordinationPartType,
  type SentenceElementName,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "./SentenceStructureDocumentProvider";

type InteractionState =
  | {
      type: "idle";
    }
  | {
      type: "sentence-structure-element-span-selecting";
      sentenceId: string;
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "span-action-selecting";
      sentenceId: string;
      startWordIndex: number;
      endWordIndex: number;
    }
  | {
      type: "sentence-structure-element-usage-selecting";
      sentenceId: string;
      sentenceConstituentType: "verbal-phrase" | "clause";
      startWordIndex: number;
      endWordIndex: number;
    }
  | {
      type: "sentence-structure-element-selected";
      sentenceId: string;
      sentenceStructureElementId: string;
    }
  | {
      type: "modification-modifier-selected";
      sentenceId: string;
      modifierSentenceStructureElement: {
        startWordIndex: number;
        endWordIndex: number;
      };
    }
  | {
      type: "modification-modified-span-selecting";
      sentenceId: string;
      modifierSentenceStructureElement: {
        startWordIndex: number;
        endWordIndex: number;
      };
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "modification-selected";
      sentenceId: string;
      modificationId: string;
    }
  | {
      type: "coordination-parts-selected";
      sentenceId: string;
      coordinationParts: {
        type: CoordinationPartType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
    }
  | {
      type: "coordination-part-span-selecting";
      sentenceId: string;
      coordinationParts: {
        type: CoordinationPartType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "coordination-part-type-selecting";
      sentenceId: string;
      coordinationParts: {
        type: CoordinationPartType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
      startWordIndex: number;
      endWordIndex: number;
    }
  | {
      type: "coordination-selected";
      sentenceId: string;
      coordinationId: string;
    };

type InteractionAction =
  | {
      type: "pointer-up-outside-word";
    }
  | {
      type: "pointer-down-on-word";
      payload: {
        sentenceId: string;
        wordIndex: number;
      };
    }
  | {
      type: "pointer-enter-on-word";
      payload: {
        sentenceId: string;
        wordIndex: number;
      };
    }
  | {
      type: "pointer-up-on-word";
      payload: {
        sentenceId: string;
        wordIndex: number;
      };
    }
  | {
      type: "select-sentence-structure-element-variant";
      payload:
        | {
            kind: "core-sentence-element";
          }
        | {
            kind: "sentence-constituent";
            type: "verbal-phrase" | "clause";
          }
        | {
            kind: "sentence-constituent";
            type: "modifier-phrase";
          };
    }
  | {
      type: "select-sentence-structure-element-usage";
      payload: {
        usage: "nominal" | "adjectival" | "adverbial";
      };
    }
  | {
      type: "update-sentence-element-name";
      payload: {
        sentenceElementName: SentenceElementName;
      };
    }
  | {
      type: "select-sentence-structure-element";
      payload: {
        sentenceId: string;
        sentenceStructureElementId: string;
      };
    }
  | {
      type: "delete-sentence-structure-element";
    }
  | {
      type: "start-modification-creation";
    }
  | {
      type: "cancel-modification-creation";
    }
  | {
      type: "select-modification";
      payload: {
        sentenceId: string;
        modificationId: string;
      };
    }
  | {
      type: "delete-modification";
    }
  | {
      type: "start-coordination-creation";
    }
  | {
      type: "add-coordination-part";
      payload: {
        coordinationPartType: CoordinationPartType;
      };
    }
  | {
      type: "confirm-coordination-creation";
    }
  | {
      type: "cancel-coordination-creation";
    }
  | {
      type: "select-coordination";
      payload: {
        sentenceId: string;
        coordinationId: string;
      };
    }
  | {
      type: "delete-coordination";
    };

function interactionStateReducer(
  interactionState: InteractionState,
  sentenceStructureDocument: SentenceStructureDocument,
  action: InteractionAction,
):
  | {
      success: true;
      interactionState: InteractionState;
      sentenceStructureDocument: SentenceStructureDocument;
    }
  | {
      success: false;
      message: string;
    } {
  switch (action.type) {
    case "pointer-up-outside-word": {
      switch (interactionState.type) {
        case "idle":
        case "span-action-selecting":
        case "sentence-structure-element-usage-selecting":
        case "sentence-structure-element-selected":
        case "modification-modifier-selected":
        case "modification-selected":
        case "coordination-parts-selected":
        case "coordination-part-type-selecting":
        case "coordination-selected": {
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureDocument,
          };
        }
        case "sentence-structure-element-span-selecting": {
          const sentence = sentenceStructureDocument.sentences.find(
            (candidateSentence) =>
              candidateSentence.id === interactionState.sentenceId,
          );
          if (!sentence) {
            throw new Error("Sentence not found");
          }

          const startWordIndex = Math.min(
            interactionState.anchorWordIndex,
            interactionState.focusWordIndex,
          );
          const endWordIndex = Math.max(
            interactionState.anchorWordIndex,
            interactionState.focusWordIndex,
          );
          const startWordId = sentence.words.at(startWordIndex)?.id;
          const endWordId = sentence.words.at(endWordIndex)?.id;
          if (!startWordId || !endWordId) {
            throw new Error("Word not found");
          }
          const matchedSentenceStructureElement =
            sentence.sentenceStructureElements.find(
              (sentenceStructureElement) =>
                sentenceStructureElement.startWordId === startWordId &&
                sentenceStructureElement.endWordId === endWordId,
            );
          if (matchedSentenceStructureElement) {
            return {
              success: true,
              interactionState: {
                type: "sentence-structure-element-selected",
                sentenceId: interactionState.sentenceId,
                sentenceStructureElementId: matchedSentenceStructureElement.id,
              },
              sentenceStructureDocument,
            };
          } else {
            return {
              success: true,
              interactionState: {
                type: "span-action-selecting",
                sentenceId: interactionState.sentenceId,
                startWordIndex,
                endWordIndex,
              },
              sentenceStructureDocument,
            };
          }
        }
        case "modification-modified-span-selecting": {
          const modifierSentenceStructureElementStartWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                interactionState.modifierSentenceStructureElement
                  .startWordIndex,
              )?.id ?? null;
          const modifierSentenceStructureElementEndWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                interactionState.modifierSentenceStructureElement.endWordIndex,
              )?.id ?? null;
          const modifiedSentenceStructureElementStartWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                Math.min(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
              )?.id ?? null;
          const modifiedSentenceStructureElementEndWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                Math.max(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
              )?.id ?? null;
          if (
            !modifierSentenceStructureElementStartWordId ||
            !modifierSentenceStructureElementEndWordId ||
            !modifiedSentenceStructureElementStartWordId ||
            !modifiedSentenceStructureElementEndWordId
          ) {
            throw new Error("Word not found");
          }

          const result = addModification(sentenceStructureDocument, {
            sentenceId: interactionState.sentenceId,
            modifierSentenceStructureElement: {
              startWordId: modifierSentenceStructureElementStartWordId,
              endWordId: modifierSentenceStructureElementEndWordId,
            },
            modifiedSentenceStructureElement: {
              startWordId: modifiedSentenceStructureElementStartWordId,
              endWordId: modifiedSentenceStructureElementEndWordId,
            },
          });
          if (result.success) {
            return {
              success: true,
              interactionState: { type: "idle" },
              sentenceStructureDocument:
                result.data.newSentenceStructureDocument,
            };
          } else {
            return {
              success: false,
              message: result.message,
            };
          }
        }
        case "coordination-part-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "coordination-part-type-selecting",
              sentenceId: interactionState.sentenceId,
              coordinationParts: interactionState.coordinationParts,
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
            },
            sentenceStructureDocument,
          };
        }
        default: {
          interactionState satisfies never;
          throw new Error("Unreachable");
        }
      }
    }
    case "pointer-down-on-word":
      switch (interactionState.type) {
        case "idle":
        case "sentence-structure-element-span-selecting":
        case "span-action-selecting":
        case "sentence-structure-element-usage-selecting":
        case "sentence-structure-element-selected":
        case "modification-selected":
        case "coordination-selected": {
          return {
            success: true,
            interactionState: {
              type: "sentence-structure-element-span-selecting",
              sentenceId: action.payload.sentenceId,
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        case "modification-modifier-selected":
        case "modification-modified-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "modification-modified-span-selecting",
              sentenceId: action.payload.sentenceId,
              modifierSentenceStructureElement:
                interactionState.modifierSentenceStructureElement,
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        case "coordination-parts-selected":
        case "coordination-part-span-selecting":
        case "coordination-part-type-selecting": {
          if (interactionState.coordinationParts.length === 0) {
            return {
              success: true,
              interactionState: {
                type: "sentence-structure-element-span-selecting",
                sentenceId: action.payload.sentenceId,
                anchorWordIndex: action.payload.wordIndex,
                focusWordIndex: action.payload.wordIndex,
              },
              sentenceStructureDocument,
            };
          }
          return {
            success: true,
            interactionState: {
              type: "coordination-part-span-selecting",
              sentenceId: action.payload.sentenceId,
              coordinationParts: interactionState.coordinationParts,
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        default: {
          interactionState satisfies never;
          throw new Error("Unreachable");
        }
      }
    case "pointer-enter-on-word":
      switch (interactionState.type) {
        case "idle":
        case "span-action-selecting":
        case "sentence-structure-element-usage-selecting":
        case "sentence-structure-element-selected":
        case "modification-modifier-selected":
        case "modification-selected":
        case "coordination-parts-selected":
        case "coordination-part-type-selecting":
        case "coordination-selected": {
          return {
            success: true,
            interactionState,
            sentenceStructureDocument,
          };
        }
        case "sentence-structure-element-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "sentence-structure-element-span-selecting",
              sentenceId: interactionState.sentenceId,
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        case "modification-modified-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "modification-modified-span-selecting",
              sentenceId: interactionState.sentenceId,
              modifierSentenceStructureElement:
                interactionState.modifierSentenceStructureElement,
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        case "coordination-part-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "coordination-part-span-selecting",
              sentenceId: interactionState.sentenceId,
              coordinationParts: interactionState.coordinationParts,
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureDocument,
          };
        }
        default: {
          interactionState satisfies never;
          throw new Error("Unreachable");
        }
      }
    case "pointer-up-on-word": {
      switch (interactionState.type) {
        case "idle":
        case "span-action-selecting":
        case "sentence-structure-element-usage-selecting":
        case "sentence-structure-element-selected":
        case "modification-modifier-selected":
        case "modification-selected":
        case "coordination-parts-selected":
        case "coordination-part-type-selecting":
        case "coordination-selected": {
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureDocument,
          };
        }
        case "sentence-structure-element-span-selecting": {
          const sentence = sentenceStructureDocument.sentences.find(
            (candidateSentence) =>
              candidateSentence.id === interactionState.sentenceId,
          );
          if (!sentence) {
            throw new Error("Sentence not found");
          }

          const startWordIndex = Math.min(
            interactionState.anchorWordIndex,
            action.payload.wordIndex,
          );
          const endWordIndex = Math.max(
            interactionState.anchorWordIndex,
            action.payload.wordIndex,
          );
          const startWordId = sentence.words.at(startWordIndex)?.id;
          const endWordId = sentence.words.at(endWordIndex)?.id;
          if (!startWordId || !endWordId) {
            throw new Error("Word not found");
          }
          const matchedSentenceStructureElement =
            sentence.sentenceStructureElements.find(
              (sentenceStructureElement) =>
                sentenceStructureElement.startWordId === startWordId &&
                sentenceStructureElement.endWordId === endWordId,
            );
          if (matchedSentenceStructureElement) {
            return {
              success: true,
              interactionState: {
                type: "sentence-structure-element-selected",
                sentenceId: interactionState.sentenceId,
                sentenceStructureElementId: matchedSentenceStructureElement.id,
              },
              sentenceStructureDocument,
            };
          } else {
            return {
              success: true,
              interactionState: {
                type: "span-action-selecting",
                sentenceId: interactionState.sentenceId,
                startWordIndex,
                endWordIndex,
              },
              sentenceStructureDocument,
            };
          }
        }
        case "modification-modified-span-selecting": {
          const modifierSentenceStructureElementStartWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                interactionState.modifierSentenceStructureElement
                  .startWordIndex,
              )?.id ?? null;
          const modifierSentenceStructureElementEndWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                interactionState.modifierSentenceStructureElement.endWordIndex,
              )?.id ?? null;
          const modifiedSentenceStructureElementStartWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                Math.min(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
              )?.id ?? null;
          const modifiedSentenceStructureElementEndWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(
                Math.max(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
              )?.id ?? null;
          if (
            !modifierSentenceStructureElementStartWordId ||
            !modifierSentenceStructureElementEndWordId ||
            !modifiedSentenceStructureElementStartWordId ||
            !modifiedSentenceStructureElementEndWordId
          ) {
            throw new Error("Word not found");
          }
          const result = addModification(sentenceStructureDocument, {
            sentenceId: interactionState.sentenceId,
            modifierSentenceStructureElement: {
              startWordId: modifierSentenceStructureElementStartWordId,
              endWordId: modifierSentenceStructureElementEndWordId,
            },
            modifiedSentenceStructureElement: {
              startWordId: modifiedSentenceStructureElementStartWordId,
              endWordId: modifiedSentenceStructureElementEndWordId,
            },
          });
          if (result.success) {
            return {
              success: true,
              interactionState: { type: "idle" },
              sentenceStructureDocument:
                result.data.newSentenceStructureDocument,
            };
          } else {
            return {
              success: false,
              message: result.message,
            };
          }
        }
        case "coordination-part-span-selecting": {
          return {
            success: true,
            interactionState: {
              type: "coordination-part-type-selecting",
              sentenceId: interactionState.sentenceId,
              coordinationParts: interactionState.coordinationParts,
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
            },
            sentenceStructureDocument,
          };
        }
        default: {
          interactionState satisfies never;
          throw new Error("Unreachable");
        }
      }
    }
    case "select-sentence-structure-element-variant": {
      if (interactionState.type !== "span-action-selecting") {
        throw new Error("Invalid interaction state");
      }

      if (
        action.payload.kind === "sentence-constituent" &&
        (action.payload.type === "verbal-phrase" ||
          action.payload.type === "clause")
      ) {
        return {
          success: true,
          interactionState: {
            type: "sentence-structure-element-usage-selecting",
            sentenceId: interactionState.sentenceId,
            sentenceConstituentType: action.payload.type,
            startWordIndex: interactionState.startWordIndex,
            endWordIndex: interactionState.endWordIndex,
          },
          sentenceStructureDocument,
        };
      }

      const result = addSentenceStructureElement(
        sentenceStructureDocument,
        (() => {
          const startWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(interactionState.startWordIndex)?.id ?? null;
          const endWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(interactionState.endWordIndex)?.id ?? null;
          if (!startWordId || !endWordId) {
            throw new Error("Word not found");
          }
          switch (action.payload.kind) {
            case "core-sentence-element": {
              return {
                sentenceId: interactionState.sentenceId,
                kind: "core-sentence-element",
                startWordId,
                endWordId,
                sentenceElementName: null,
              };
            }
            case "sentence-constituent": {
              switch (action.payload.type) {
                case "verbal-phrase":
                case "clause": {
                  throw new Error("Unreachable");
                }
                case "modifier-phrase": {
                  return {
                    sentenceId: interactionState.sentenceId,
                    kind: "sentence-constituent",
                    type: action.payload.type,
                    startWordId,
                    endWordId,
                    sentenceElementName: null,
                  };
                }
                default: {
                  action.payload satisfies never;
                  throw new Error("Unreachable");
                }
              }
            }
            default: {
              action.payload satisfies never;
              throw new Error("Unreachable");
            }
          }
        })(),
      );
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "sentence-structure-element-selected",
            sentenceId: interactionState.sentenceId,
            sentenceStructureElementId: result.data.sentenceStructureElementId,
          },
          sentenceStructureDocument: result.data.newSentenceStructureDocument,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "select-sentence-structure-element-usage": {
      if (
        interactionState.type !== "sentence-structure-element-usage-selecting"
      ) {
        throw new Error("Invalid interaction state");
      }

      const result = addSentenceStructureElement(
        sentenceStructureDocument,
        (() => {
          const startWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(interactionState.startWordIndex)?.id ?? null;
          const endWordId =
            sentenceStructureDocument.sentences
              .find((sentence) => sentence.id === interactionState.sentenceId)
              ?.words.at(interactionState.endWordIndex)?.id ?? null;
          if (!startWordId || !endWordId) {
            throw new Error("Word not found");
          }
          return {
            sentenceId: interactionState.sentenceId,
            kind: "sentence-constituent",
            type: interactionState.sentenceConstituentType,
            usage: action.payload.usage,
            startWordId,
            endWordId,
            sentenceElementName: null,
          };
        })(),
      );
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "sentence-structure-element-selected",
            sentenceId: interactionState.sentenceId,
            sentenceStructureElementId: result.data.sentenceStructureElementId,
          },
          sentenceStructureDocument: result.data.newSentenceStructureDocument,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "update-sentence-element-name": {
      if (interactionState.type !== "sentence-structure-element-selected") {
        throw new Error("Invalid interaction state");
      }

      const result = updateSentenceElementName(sentenceStructureDocument, {
        sentenceId: interactionState.sentenceId,
        sentenceStructureElementId: interactionState.sentenceStructureElementId,
        sentenceElementName: action.payload.sentenceElementName,
      });
      if (result.success) {
        return {
          success: true,
          interactionState,
          sentenceStructureDocument: result.data.newSentenceStructureDocument,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "select-sentence-structure-element": {
      return {
        success: true,
        interactionState: {
          type: "sentence-structure-element-selected",
          sentenceId: action.payload.sentenceId,
          sentenceStructureElementId: action.payload.sentenceStructureElementId,
        },
        sentenceStructureDocument,
      };
    }
    case "delete-sentence-structure-element": {
      if (interactionState.type !== "sentence-structure-element-selected") {
        throw new Error("Invalid interaction state");
      }

      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureDocument: deleteSentenceStructureElement(
          sentenceStructureDocument,
          {
            sentenceId: interactionState.sentenceId,
            sentenceStructureElementId:
              interactionState.sentenceStructureElementId,
          },
        ),
      };
    }
    case "start-modification-creation": {
      if (
        interactionState.type !== "span-action-selecting" &&
        interactionState.type !== "sentence-structure-element-selected"
      ) {
        throw new Error("Invalid interaction state");
      }

      const sentence = sentenceStructureDocument.sentences.find(
        (sentence) => sentence.id === interactionState.sentenceId,
      );
      if (!sentence) {
        throw new Error("Sentence not found");
      }

      const selectingSpan = (() => {
        switch (interactionState.type) {
          case "span-action-selecting": {
            return {
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            };
          }
          case "sentence-structure-element-selected": {
            const selectingSentenceStructureElement =
              sentence.sentenceStructureElements.find(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  interactionState.sentenceStructureElementId,
              );
            if (!selectingSentenceStructureElement) {
              throw new Error("Sentence structure element not found");
            }

            const startWordIndex = sentence.words.findIndex(
              (word) =>
                word.id === selectingSentenceStructureElement.startWordId,
            );
            const endWordIndex = sentence.words.findIndex(
              (word) => word.id === selectingSentenceStructureElement.endWordId,
            );
            if (startWordIndex === -1 || endWordIndex === -1) {
              throw new Error("Word not found");
            }

            return {
              startWordIndex,
              endWordIndex,
            };
          }
          default: {
            interactionState satisfies never;
            throw new Error("Unreachable");
          }
        }
      })();

      return {
        success: true,
        interactionState: {
          type: "modification-modifier-selected",
          sentenceId: interactionState.sentenceId,
          modifierSentenceStructureElement: selectingSpan,
        },
        sentenceStructureDocument,
      };
    }
    case "cancel-modification-creation": {
      if (
        interactionState.type !== "modification-modifier-selected" &&
        interactionState.type !== "modification-modified-span-selecting"
      ) {
        throw new Error("Invalid interaction state");
      }

      const sentence = sentenceStructureDocument.sentences.find(
        (sentence) => sentence.id === interactionState.sentenceId,
      );
      if (!sentence) {
        throw new Error("Sentence not found");
      }

      const startWordId =
        sentence.words.at(
          interactionState.modifierSentenceStructureElement.startWordIndex,
        )?.id ?? null;
      const endWordId =
        sentence.words.at(
          interactionState.modifierSentenceStructureElement.endWordIndex,
        )?.id ?? null;
      if (!startWordId || !endWordId) {
        throw new Error("Word not found");
      }

      const modifierSentenceStructureElement =
        sentence.sentenceStructureElements.find(
          (sentenceStructureElement) =>
            sentenceStructureElement.startWordId === startWordId &&
            sentenceStructureElement.endWordId === endWordId,
        );

      if (modifierSentenceStructureElement) {
        return {
          success: true,
          interactionState: {
            type: "sentence-structure-element-selected",
            sentenceId: interactionState.sentenceId,
            sentenceStructureElementId: modifierSentenceStructureElement.id,
          },
          sentenceStructureDocument,
        };
      } else {
        return {
          success: true,
          interactionState: {
            type: "idle",
          },
          sentenceStructureDocument,
        };
      }
    }
    case "select-modification": {
      return {
        success: true,
        interactionState: {
          type: "modification-selected",
          sentenceId: action.payload.sentenceId,
          modificationId: action.payload.modificationId,
        },
        sentenceStructureDocument,
      };
    }
    case "delete-modification": {
      if (interactionState.type !== "modification-selected") {
        throw new Error("Invalid interaction state");
      }

      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureDocument: deleteModification(
          sentenceStructureDocument,
          {
            sentenceId: interactionState.sentenceId,
            modificationId: interactionState.modificationId,
          },
        ),
      };
    }
    case "start-coordination-creation": {
      if (
        interactionState.type !== "span-action-selecting" &&
        interactionState.type !== "sentence-structure-element-selected"
      ) {
        throw new Error("Invalid interaction state");
      }

      const sentence = sentenceStructureDocument.sentences.find(
        (sentence) => sentence.id === interactionState.sentenceId,
      );
      if (!sentence) {
        throw new Error("Sentence not found");
      }

      const selectingSpan = (() => {
        switch (interactionState.type) {
          case "span-action-selecting": {
            return {
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            };
          }
          case "sentence-structure-element-selected": {
            const selectingSentenceStructureElement =
              sentence.sentenceStructureElements.find(
                (sentenceStructureElement) =>
                  sentenceStructureElement.id ===
                  interactionState.sentenceStructureElementId,
              );
            if (!selectingSentenceStructureElement) {
              throw new Error("Sentence structure element not found");
            }

            const startWordIndex = sentence.words.findIndex(
              (word) =>
                word.id === selectingSentenceStructureElement.startWordId,
            );
            const endWordIndex = sentence.words.findIndex(
              (word) => word.id === selectingSentenceStructureElement.endWordId,
            );
            if (startWordIndex === -1 || endWordIndex === -1) {
              throw new Error("Word not found");
            }

            return {
              startWordIndex,
              endWordIndex,
            };
          }
          default: {
            interactionState satisfies never;
            throw new Error("Unreachable");
          }
        }
      })();

      return {
        success: true,
        interactionState: {
          type: "coordination-part-type-selecting",
          sentenceId: interactionState.sentenceId,
          coordinationParts: [],
          startWordIndex: selectingSpan.startWordIndex,
          endWordIndex: selectingSpan.endWordIndex,
        },
        sentenceStructureDocument,
      };
    }
    case "add-coordination-part": {
      if (interactionState.type !== "coordination-part-type-selecting") {
        throw new Error("Invalid interaction state");
      }

      return {
        success: true,
        interactionState: {
          type: "coordination-parts-selected",
          sentenceId: interactionState.sentenceId,
          coordinationParts: [
            ...interactionState.coordinationParts,
            {
              type: action.payload.coordinationPartType,
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            },
          ],
        },
        sentenceStructureDocument,
      };
    }
    case "confirm-coordination-creation": {
      if (
        interactionState.type !== "coordination-parts-selected" &&
        interactionState.type !== "coordination-part-span-selecting"
      ) {
        throw new Error("Invalid interaction state");
      }

      const sentence = sentenceStructureDocument.sentences.find(
        (sentence) => sentence.id === interactionState.sentenceId,
      );
      if (!sentence) {
        throw new Error("Sentence not found");
      }

      const result = addCoordination(sentenceStructureDocument, {
        sentenceId: interactionState.sentenceId,
        coordinationParts: interactionState.coordinationParts.map(
          (coordinationPart) => {
            const startWordId =
              sentence.words.at(coordinationPart.startWordIndex)?.id ?? null;
            const endWordId =
              sentence.words.at(coordinationPart.endWordIndex)?.id ?? null;
            if (!startWordId || !endWordId) {
              throw new Error("Word not found");
            }
            return {
              type: coordinationPart.type,
              startWordId,
              endWordId,
            };
          },
        ),
      });
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "idle",
          },
          sentenceStructureDocument: result.data.newSentenceStructureDocument,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "cancel-coordination-creation": {
      if (
        interactionState.type !== "coordination-parts-selected" &&
        interactionState.type !== "coordination-part-span-selecting"
      ) {
        throw new Error("Invalid interaction state");
      }

      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureDocument,
      };
    }
    case "select-coordination": {
      return {
        success: true,
        interactionState: {
          type: "coordination-selected",
          sentenceId: action.payload.sentenceId,
          coordinationId: action.payload.coordinationId,
        },
        sentenceStructureDocument,
      };
    }
    case "delete-coordination": {
      if (interactionState.type !== "coordination-selected") {
        throw new Error("Invalid interaction state");
      }

      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureDocument: deleteCoordination(
          sentenceStructureDocument,
          {
            sentenceId: interactionState.sentenceId,
            coordinationId: interactionState.coordinationId,
          },
        ),
      };
    }
    default: {
      action satisfies never;
      throw new Error("Unreachable");
    }
  }
}

type InteractionStateContextValue = {
  interactionState: InteractionState;
  handlePointerUpOutsideWord: () =>
    | { success: true }
    | { success: false; message: string };
  handlePointerDownOnWord: (input: {
    sentenceId: string;
    wordIndex: number;
  }) => { success: true } | { success: false; message: string };
  handlePointerEnterOnWord: (input: {
    sentenceId: string;
    wordIndex: number;
  }) => { success: true } | { success: false; message: string };
  handlePointerUpOnWord: (input: {
    sentenceId: string;
    wordIndex: number;
  }) => { success: true } | { success: false; message: string };
  handleSelectSentenceStructureElementVariant: (
    input:
      | { kind: "core-sentence-element" }
      | {
          kind: "sentence-constituent";
          type: "verbal-phrase" | "clause";
        }
      | { kind: "sentence-constituent"; type: "modifier-phrase" },
  ) => { success: true } | { success: false; message: string };
  handleSelectSentenceStructureElementUsage: (input: {
    usage: "nominal" | "adjectival" | "adverbial";
  }) => { success: true } | { success: false; message: string };
  handleUpdateSentenceElementName: (input: {
    sentenceElementName: SentenceElementName;
  }) => { success: true } | { success: false; message: string };
  handleSelectSentenceStructureElement: (input: {
    sentenceId: string;
    sentenceStructureElementId: string;
  }) => { success: true } | { success: false; message: string };
  handleDeleteSentenceStructureElement: () =>
    | { success: true }
    | { success: false; message: string };
  handleStartModificationCreation: () =>
    | { success: true }
    | { success: false; message: string };
  handleCancelModificationCreation: () =>
    | { success: true }
    | { success: false; message: string };
  handleSelectModification: (input: {
    sentenceId: string;
    modificationId: string;
  }) => { success: true } | { success: false; message: string };
  handleDeleteModification: () =>
    | { success: true }
    | { success: false; message: string };
  handleStartCoordinationCreation: () =>
    | { success: true }
    | { success: false; message: string };
  handleAddCoordinationPart: (input: {
    coordinationPartType: CoordinationPartType;
  }) => { success: true } | { success: false; message: string };
  handleConfirmCoordinationCreation: () =>
    | { success: true }
    | { success: false; message: string };
  handleCancelCoordinationCreation: () =>
    | { success: true }
    | { success: false; message: string };
  handleSelectCoordination: (input: {
    sentenceId: string;
    coordinationId: string;
  }) => { success: true } | { success: false; message: string };
  handleDeleteCoordination: () =>
    | { success: true }
    | { success: false; message: string };
};

const InteractionStateContext =
  createContext<InteractionStateContextValue | null>(null);

export function InteractionStateProvider(props: PropsWithChildren) {
  const [interactionState, setInteractionState] = useState<InteractionState>({
    type: "idle",
  });
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

  return (
    <InteractionStateContext.Provider
      value={{
        interactionState,
        handlePointerUpOutsideWord: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "pointer-up-outside-word" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handlePointerDownOnWord: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "pointer-down-on-word",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handlePointerEnterOnWord: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "pointer-enter-on-word",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handlePointerUpOnWord: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "pointer-up-on-word",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleSelectSentenceStructureElementVariant: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "select-sentence-structure-element-variant",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleSelectSentenceStructureElementUsage: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "select-sentence-structure-element-usage",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleUpdateSentenceElementName: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "update-sentence-element-name",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleSelectSentenceStructureElement: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "select-sentence-structure-element", payload: input },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteSentenceStructureElement: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "delete-sentence-structure-element" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleStartModificationCreation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "start-modification-creation" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCancelModificationCreation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "cancel-modification-creation" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleSelectModification: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "select-modification", payload: input },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteModification: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "delete-modification" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleStartCoordinationCreation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "start-coordination-creation" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleAddCoordinationPart: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            {
              type: "add-coordination-part",
              payload: input,
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleConfirmCoordinationCreation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "confirm-coordination-creation" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCancelCoordinationCreation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "cancel-coordination-creation" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleSelectCoordination: (input) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "select-coordination", payload: input },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteCoordination: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureDocument,
            { type: "delete-coordination" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureDocument(result.sentenceStructureDocument);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
      }}
    >
      {props.children}
    </InteractionStateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInteractionState() {
  const context = useContext(InteractionStateContext);
  if (!context) {
    throw new Error(
      "useInteractionState must be used within a InteractionStateProvider",
    );
  }
  return context;
}
