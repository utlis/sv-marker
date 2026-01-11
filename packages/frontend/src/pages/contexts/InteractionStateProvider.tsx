import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  createCoordination,
  createRelation,
  createSentenceElementRange,
  createSentenceStructureRange,
  deleteCoordination,
  deleteRange,
  deleteRelation,
  findRangeById,
  findRangeByStartAndEndWordIndex,
  updateSentenceElementName,
  type CoordinationChildType,
  type RangeType,
  type SentenceElementName,
  type SentenceElementRangeType,
  type SentenceStructureData,
  type SentenceStructureRangeType,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import { useSentenceStructureData } from "./SentenceStructureDataProvider";

type InteractionState =
  | {
      type: "idle";
    }
  | {
      type: "range-selecting";
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "range-confirming";
      startWordIndex: number;
      endWordIndex: number;
    }
  | {
      type: "range-selected";
      rangeType: RangeType;
      rangeId: string;
    }
  | {
      type: "relation-idle";
      fromRange: {
        startWordIndex: number;
        endWordIndex: number;
      };
    }
  | {
      type: "relation-selecting";
      fromRange: {
        startWordIndex: number;
        endWordIndex: number;
      };
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "relation-selected";
      relationId: string;
    }
  | {
      type: "coordination-idle";
      children: {
        type: CoordinationChildType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
    }
  | {
      type: "coordination-selecting";
      children: {
        type: CoordinationChildType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
      anchorWordIndex: number;
      focusWordIndex: number;
    }
  | {
      type: "coordination-confirming";
      children: {
        type: CoordinationChildType;
        startWordIndex: number;
        endWordIndex: number;
      }[];
      startWordIndex: number;
      endWordIndex: number;
    }
  | {
      type: "coordination-selected";
      coordinationId: string;
    };

type InteractionStateAction =
  | {
      type: "MOUSE_UP_OUTSIDE_WORD";
    }
  | {
      type: "MOUSE_DOWN_ON_WORD";
      payload: {
        wordIndex: number;
      };
    }
  | {
      type: "MOUSE_ENTER_ON_WORD";
      payload: {
        wordIndex: number;
      };
    }
  | {
      type: "MOUSE_UP_ON_WORD";
      payload: {
        wordIndex: number;
      };
    }
  | {
      type: "CREATE_SENTENCE_ELEMENT_RANGE";
      payload: {
        rangeType: SentenceElementRangeType;
      };
    }
  | {
      type: "CREATE_SENTENCE_STRUCTURE_RANGE";
      payload: {
        rangeType: SentenceStructureRangeType;
      };
    }
  | {
      type: "CLICK_ON_RANGE";
      payload: {
        rangeId: string;
      };
    }
  | {
      type: "UPDATE_SENTENCE_ELEMENT_NAME";
      payload: {
        sentenceElementName: SentenceElementName;
      };
    }
  | {
      type: "DELETE_RANGE";
    }
  | {
      type: "START_CREATING_RELATION";
    }
  | {
      type: "CANCEL_CREATING_RELATION";
    }
  | {
      type: "CLICK_ON_RELATION";
      payload: {
        relationId: string;
      };
    }
  | {
      type: "DELETE_RELATION";
    }
  | {
      type: "START_CREATING_COORDINATION";
    }
  | {
      type: "CREATE_COORDINATION_CHILD";
      payload: {
        coordinationChildType: CoordinationChildType;
      };
    }
  | {
      type: "CONFIRM_CREATING_COORDINATION";
    }
  | {
      type: "CANCEL_CREATING_COORDINATION";
    }
  | {
      type: "CLICK_ON_COORDINATION";
      payload: {
        coordinationId: string;
      };
    }
  | {
      type: "DELETE_COORDINATION";
    };

function interactionStateReducer(
  interactionState: InteractionState,
  sentenceStructureData: SentenceStructureData,
  action: InteractionStateAction,
):
  | {
      success: true;
      interactionState: InteractionState;
      sentenceStructureData: SentenceStructureData;
    }
  | {
      success: false;
      message: string;
    } {
  switch (action.type) {
    case "MOUSE_UP_OUTSIDE_WORD":
      switch (interactionState.type) {
        case "idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "range-selecting": {
          const matchedRange = findRangeByStartAndEndWordIndex(
            sentenceStructureData,
            {
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
            },
          );
          if (matchedRange) {
            return {
              success: true,
              interactionState: {
                type: "range-selected",
                rangeType: matchedRange.type,
                rangeId: matchedRange.id,
              },
              sentenceStructureData,
            };
          } else {
            return {
              success: true,
              interactionState: {
                type: "range-confirming",
                startWordIndex: Math.min(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
                endWordIndex: Math.max(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
              },
              sentenceStructureData,
            };
          }
        }
        case "range-confirming":
        case "range-selected":
        case "relation-idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "relation-selecting": {
          const newSentenceStructureData = createRelation(
            sentenceStructureData,
            {
              fromRange: interactionState.fromRange,
              toRange: {
                startWordIndex: Math.min(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
                endWordIndex: Math.max(
                  interactionState.anchorWordIndex,
                  interactionState.focusWordIndex,
                ),
              },
            },
          );
          if (newSentenceStructureData.success) {
            return {
              success: true,
              interactionState: { type: "idle" },
              sentenceStructureData:
                newSentenceStructureData.data.newSentenceStructureData,
            };
          } else {
            return {
              success: false,
              message: newSentenceStructureData.message,
            };
          }
        }
        case "relation-selected":
        case "coordination-idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "coordination-selecting": {
          return {
            success: true,
            interactionState: {
              type: "coordination-confirming",
              children: interactionState.children,
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                interactionState.focusWordIndex,
              ),
            },
            sentenceStructureData,
          };
        }
        case "coordination-confirming":
        case "coordination-selected":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        default: {
          const _exhaustiveCheck: never = interactionState;
          return _exhaustiveCheck;
        }
      }
    case "MOUSE_DOWN_ON_WORD":
      switch (interactionState.type) {
        case "idle":
        case "range-selecting":
        case "range-confirming":
        case "range-selected":
        case "relation-selected":
        case "coordination-selected":
          return {
            success: true,
            interactionState: {
              type: "range-selecting",
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        case "relation-idle":
        case "relation-selecting":
          return {
            success: true,
            interactionState: {
              type: "relation-selecting",
              fromRange: interactionState.fromRange,
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        case "coordination-idle":
        case "coordination-selecting":
        case "coordination-confirming":
          if (interactionState.children.length === 0) {
            return {
              success: true,
              interactionState: {
                type: "range-selecting",
                anchorWordIndex: action.payload.wordIndex,
                focusWordIndex: action.payload.wordIndex,
              },
              sentenceStructureData,
            };
          }
          return {
            success: true,
            interactionState: {
              type: "coordination-selecting",
              children: interactionState.children,
              anchorWordIndex: action.payload.wordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        default: {
          const _exhaustiveCheck: never = interactionState;
          return _exhaustiveCheck;
        }
      }
    case "MOUSE_ENTER_ON_WORD":
      switch (interactionState.type) {
        case "idle":
          return {
            success: true,
            interactionState,
            sentenceStructureData,
          };
        case "range-selecting":
          return {
            success: true,
            interactionState: {
              type: "range-selecting",
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        case "range-confirming":
        case "range-selected":
        case "relation-idle":
          return {
            success: true,
            interactionState,
            sentenceStructureData,
          };
        case "relation-selecting":
          return {
            success: true,
            interactionState: {
              type: "relation-selecting",
              fromRange: interactionState.fromRange,
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        case "relation-selected":
        case "coordination-idle":
          return {
            success: true,
            interactionState,
            sentenceStructureData,
          };
        case "coordination-selecting":
          return {
            success: true,
            interactionState: {
              type: "coordination-selecting",
              children: interactionState.children,
              anchorWordIndex: interactionState.anchorWordIndex,
              focusWordIndex: action.payload.wordIndex,
            },
            sentenceStructureData,
          };
        case "coordination-confirming":
        case "coordination-selected":
          return {
            success: true,
            interactionState,
            sentenceStructureData,
          };
        default: {
          const _exhaustiveCheck: never = interactionState;
          return _exhaustiveCheck;
        }
      }
    case "MOUSE_UP_ON_WORD":
      switch (interactionState.type) {
        case "idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "range-selecting": {
          const matchedRange = findRangeByStartAndEndWordIndex(
            sentenceStructureData,
            {
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
            },
          );
          if (matchedRange) {
            return {
              success: true,
              interactionState: {
                type: "range-selected",
                rangeType: matchedRange.type,
                rangeId: matchedRange.id,
              },
              sentenceStructureData,
            };
          } else {
            return {
              success: true,
              interactionState: {
                type: "range-confirming",
                startWordIndex: Math.min(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
                endWordIndex: Math.max(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
              },
              sentenceStructureData,
            };
          }
        }
        case "range-confirming":
        case "range-selected":
        case "relation-idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "relation-selecting": {
          const newSentenceStructureData = createRelation(
            sentenceStructureData,
            {
              fromRange: interactionState.fromRange,
              toRange: {
                startWordIndex: Math.min(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
                endWordIndex: Math.max(
                  interactionState.anchorWordIndex,
                  action.payload.wordIndex,
                ),
              },
            },
          );
          if (newSentenceStructureData.success) {
            return {
              success: true,
              interactionState: { type: "idle" },
              sentenceStructureData:
                newSentenceStructureData.data.newSentenceStructureData,
            };
          } else {
            return {
              success: false,
              message: newSentenceStructureData.message,
            };
          }
        }
        case "relation-selected":
        case "coordination-idle":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        case "coordination-selecting": {
          return {
            success: true,
            interactionState: {
              type: "coordination-confirming",
              children: interactionState.children,
              startWordIndex: Math.min(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
              endWordIndex: Math.max(
                interactionState.anchorWordIndex,
                action.payload.wordIndex,
              ),
            },
            sentenceStructureData,
          };
        }
        case "coordination-confirming":
        case "coordination-selected":
          return {
            success: true,
            interactionState: { type: "idle" },
            sentenceStructureData,
          };
        default: {
          const _exhaustiveCheck: never = interactionState;
          return _exhaustiveCheck;
        }
      }
    case "CREATE_SENTENCE_ELEMENT_RANGE": {
      if (interactionState.type !== "range-confirming")
        throw new Error("Invalid interaction state");
      const result = createSentenceElementRange(sentenceStructureData, {
        type: action.payload.rangeType,
        startWordIndex: interactionState.startWordIndex,
        endWordIndex: interactionState.endWordIndex,
      });
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "range-selected",
            rangeType: action.payload.rangeType,
            rangeId: result.data.rangeId,
          },
          sentenceStructureData: result.data.newSentenceStructureData,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "CREATE_SENTENCE_STRUCTURE_RANGE": {
      if (interactionState.type !== "range-confirming")
        throw new Error("Invalid interaction state");
      const result = createSentenceStructureRange(sentenceStructureData, {
        type: action.payload.rangeType,
        startWordIndex: interactionState.startWordIndex,
        endWordIndex: interactionState.endWordIndex,
      });
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "range-selected",
            rangeType: action.payload.rangeType,
            rangeId: result.data.rangeId,
          },
          sentenceStructureData: result.data.newSentenceStructureData,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "CLICK_ON_RANGE": {
      const matchedRange = findRangeById(sentenceStructureData, {
        rangeId: action.payload.rangeId,
      });
      if (!matchedRange) throw new Error("Invalid range ID");

      return {
        success: true,
        interactionState: {
          type: "range-selected",
          rangeType: matchedRange.type,
          rangeId: action.payload.rangeId,
        },
        sentenceStructureData,
      };
    }
    case "UPDATE_SENTENCE_ELEMENT_NAME":
      if (interactionState.type !== "range-selected")
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState,
        sentenceStructureData: updateSentenceElementName<
          typeof interactionState.rangeType
        >(sentenceStructureData, {
          rangeId: interactionState.rangeId,
          sentenceElementName: action.payload.sentenceElementName,
        }),
      };
    case "DELETE_RANGE":
      if (interactionState.type !== "range-selected")
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureData: deleteRange(sentenceStructureData, {
          rangeId: interactionState.rangeId,
        }),
      };
    case "START_CREATING_RELATION": {
      if (
        interactionState.type !== "range-confirming" &&
        interactionState.type !== "range-selected"
      )
        throw new Error("Invalid interaction state");
      const fromRange =
        interactionState.type === "range-confirming"
          ? {
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            }
          : findRangeById(sentenceStructureData, {
              rangeId: interactionState.rangeId,
            });
      if (!fromRange) throw new Error("Invalid range ID");
      return {
        success: true,
        interactionState: {
          type: "relation-idle",
          fromRange,
        },
        sentenceStructureData,
      };
    }
    case "CANCEL_CREATING_RELATION": {
      if (
        interactionState.type !== "relation-idle" &&
        interactionState.type !== "relation-selecting"
      )
        throw new Error("Invalid interaction state");
      const fromRange = findRangeByStartAndEndWordIndex(sentenceStructureData, {
        startWordIndex: interactionState.fromRange.startWordIndex,
        endWordIndex: interactionState.fromRange.endWordIndex,
      });
      if (fromRange) {
        return {
          success: true,
          interactionState: {
            type: "range-selected",
            rangeType: fromRange.type,
            rangeId: fromRange.id,
          },
          sentenceStructureData,
        };
      } else {
        return {
          success: true,
          interactionState: {
            type: "idle",
          },
          sentenceStructureData,
        };
      }
    }
    case "CLICK_ON_RELATION":
      return {
        success: true,
        interactionState: {
          type: "relation-selected",
          relationId: action.payload.relationId,
        },
        sentenceStructureData,
      };
    case "DELETE_RELATION":
      if (interactionState.type !== "relation-selected")
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureData: deleteRelation(sentenceStructureData, {
          relationId: interactionState.relationId,
        }),
      };
    case "START_CREATING_COORDINATION":
      if (
        interactionState.type !== "range-confirming" &&
        interactionState.type !== "range-selected"
      )
        throw new Error("Invalid interaction state");
      switch (interactionState.type) {
        case "range-confirming":
          return {
            success: true,
            interactionState: {
              type: "coordination-confirming",
              children: [],
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            },
            sentenceStructureData,
          };
        case "range-selected": {
          const selectingRange = findRangeById(sentenceStructureData, {
            rangeId: interactionState.rangeId,
          });
          if (!selectingRange) throw new Error("Invalid range ID");
          return {
            success: true,
            interactionState: {
              type: "coordination-confirming",
              children: [],
              startWordIndex: selectingRange.startWordIndex,
              endWordIndex: selectingRange.endWordIndex,
            },
            sentenceStructureData,
          };
        }
        default: {
          const _exhaustiveCheck: never = interactionState;
          return _exhaustiveCheck;
        }
      }
    case "CREATE_COORDINATION_CHILD":
      if (interactionState.type !== "coordination-confirming")
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState: {
          type: "coordination-idle",
          children: [
            ...interactionState.children,
            {
              type: action.payload.coordinationChildType,
              startWordIndex: interactionState.startWordIndex,
              endWordIndex: interactionState.endWordIndex,
            },
          ],
        },
        sentenceStructureData,
      };
    case "CONFIRM_CREATING_COORDINATION": {
      if (
        interactionState.type !== "coordination-idle" &&
        interactionState.type !== "coordination-selecting"
      )
        throw new Error("Invalid interaction state");
      const result = createCoordination(sentenceStructureData, {
        children: interactionState.children,
      });
      if (result.success) {
        return {
          success: true,
          interactionState: {
            type: "idle",
          },
          sentenceStructureData: result.data.newSentenceStructureData,
        };
      } else {
        return { success: false, message: result.message };
      }
    }
    case "CANCEL_CREATING_COORDINATION":
      if (
        interactionState.type !== "coordination-idle" &&
        interactionState.type !== "coordination-selecting"
      )
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureData,
      };
    case "CLICK_ON_COORDINATION":
      return {
        success: true,
        interactionState: {
          type: "coordination-selected",
          coordinationId: action.payload.coordinationId,
        },
        sentenceStructureData,
      };
    case "DELETE_COORDINATION":
      if (interactionState.type !== "coordination-selected")
        throw new Error("Invalid interaction state");
      return {
        success: true,
        interactionState: {
          type: "idle",
        },
        sentenceStructureData: deleteCoordination(sentenceStructureData, {
          coordinationId: interactionState.coordinationId,
        }),
      };
    default: {
      const _exhaustiveCheck: never = action;
      return _exhaustiveCheck;
    }
  }
}

type InteractionStateContextValue = {
  interactionState: InteractionState;
  handleMouseUpOutsideWord: () =>
    | { success: true }
    | { success: false; message: string };
  handleMouseDownOnWord: (
    wordIndex: number,
  ) => { success: true } | { success: false; message: string };
  handleMouseEnterOnWord: (
    wordIndex: number,
  ) => { success: true } | { success: false; message: string };
  handleMouseUpOnWord: (
    wordIndex: number,
  ) => { success: true } | { success: false; message: string };
  handleCreateSentenceElementRange: (
    rangeType: SentenceElementRangeType,
  ) => { success: true } | { success: false; message: string };
  handleCreateSentenceStructureRange: (
    rangeType: SentenceStructureRangeType,
  ) => { success: true } | { success: false; message: string };
  handleClickOnRange: (
    rangeId: string,
  ) => { success: true } | { success: false; message: string };
  handleUpdateSentenceElementName: (
    sentenceElementName: SentenceElementName,
  ) => { success: true } | { success: false; message: string };
  handleDeleteRange: () =>
    | { success: true }
    | { success: false; message: string };
  handleStartCreatingRelation: () =>
    | { success: true }
    | { success: false; message: string };
  handleCancelCreatingRelation: () =>
    | { success: true }
    | { success: false; message: string };
  handleClickOnRelation: (
    relationId: string,
  ) => { success: true } | { success: false; message: string };
  handleDeleteRelation: () =>
    | { success: true }
    | { success: false; message: string };
  handleStartCreatingCoordination: () =>
    | { success: true }
    | { success: false; message: string };
  handleCreateCoordinationChild: (
    coordinationChildType: CoordinationChildType,
  ) => { success: true } | { success: false; message: string };
  handleConfirmCreatingCoordination: () =>
    | { success: true }
    | { success: false; message: string };
  handleCancelCreatingCoordination: () =>
    | { success: true }
    | { success: false; message: string };
  handleClickOnCoordination: (
    coordinationId: string,
  ) => { success: true } | { success: false; message: string };
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
  const { sentenceStructureData, setSentenceStructureData } =
    useSentenceStructureData();

  return (
    <InteractionStateContext.Provider
      value={{
        interactionState,
        handleMouseUpOutsideWord: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "MOUSE_UP_OUTSIDE_WORD" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleMouseDownOnWord: (wordIndex: number) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "MOUSE_DOWN_ON_WORD", payload: { wordIndex } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleMouseEnterOnWord: (wordIndex: number) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "MOUSE_ENTER_ON_WORD", payload: { wordIndex } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleMouseUpOnWord: (wordIndex: number) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "MOUSE_UP_ON_WORD", payload: { wordIndex } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCreateSentenceElementRange: (rangeType) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            {
              type: "CREATE_SENTENCE_ELEMENT_RANGE",
              payload: { rangeType },
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCreateSentenceStructureRange: (rangeType) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            {
              type: "CREATE_SENTENCE_STRUCTURE_RANGE",
              payload: { rangeType },
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleClickOnRange: (rangeId: string) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CLICK_ON_RANGE", payload: { rangeId } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleUpdateSentenceElementName: (sentenceElementName) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            {
              type: "UPDATE_SENTENCE_ELEMENT_NAME",
              payload: { sentenceElementName },
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteRange: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "DELETE_RANGE" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleStartCreatingRelation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "START_CREATING_RELATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCancelCreatingRelation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CANCEL_CREATING_RELATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleClickOnRelation: (relationId: string) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CLICK_ON_RELATION", payload: { relationId } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteRelation: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "DELETE_RELATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleStartCreatingCoordination: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "START_CREATING_COORDINATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCreateCoordinationChild: (coordinationChildType) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            {
              type: "CREATE_COORDINATION_CHILD",
              payload: { coordinationChildType },
            },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleConfirmCreatingCoordination: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CONFIRM_CREATING_COORDINATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleCancelCreatingCoordination: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CANCEL_CREATING_COORDINATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleClickOnCoordination: (coordinationId: string) => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "CLICK_ON_COORDINATION", payload: { coordinationId } },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
            return { success: true };
          } else {
            return { success: false, message: result.message };
          }
        },
        handleDeleteCoordination: () => {
          const result = interactionStateReducer(
            interactionState,
            sentenceStructureData,
            { type: "DELETE_COORDINATION" },
          );
          if (result.success) {
            setInteractionState(result.interactionState);
            setSentenceStructureData(result.sentenceStructureData);
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
