import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";
import {
  Box,
  Button,
  Divider,
  Paper,
  Popper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  ClearAll as ClearAllIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  allowedSentenceElementNameOptions,
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToText,
  updateSentenceStructureDocumentText,
} from "@sv-marker/sentence-structure-document";
import { createSentenceStructureDiagramData } from "@sv-marker/sentence-structure-diagram";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";
import { useSentenceStructureDiagramAnnotationSettings } from "../contexts/SentenceStructureDiagramAnnotationSettingsProvider";
import { useInteractionState } from "../contexts/InteractionStateProvider";
import { measureTextWidth } from "../utils/measure-text-width";
import AppBar from "./AppBar";
import SplitButtons from "./ui/SplitButtons";
import ReviseSentenceStructureDocumentDialog from "./ReviseSentenceStructureDocumentDialog";
import ConfirmClearSentenceStructureAnnotationsDialog from "./ConfirmClearSentenceStructureAnnotationsDialog";
import SentenceStructureAnnotator from "./SentenceStructureAnnotator";

export default function SentenceStructureEditor() {
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

  const {
    resolvedSentenceStructureDiagramNotation,
    annotationPresetName,
    setAnnotationPresetName,
    setCanvasWidth,
  } = useSentenceStructureDiagramAnnotationSettings();

  const [isTextEditing, setIsTextEditing] = useState(
    sentenceStructureDocument.sentences.length === 0,
  );

  const [text, setText] = useState("");

  const { data: statusData } = useQuery(trpc.status.queryOptions());
  const generateSimplifiedSentenceStructureDocumentMutation = useMutation(
    trpc.generateSimplifiedSentenceStructureDocument.mutationOptions(),
  );
  const reviseSimplifiedSentenceStructureDocumentMutation = useMutation(
    trpc.reviseSimplifiedSentenceStructureDocument.mutationOptions(),
  );

  const [
    isReviseSentenceStructureDocumentDialogOpen,
    setIsReviseSentenceStructureDocumentDialogOpen,
  ] = useState(false);

  const [
    isConfirmClearSentenceStructureAnnotationsDialogOpen,
    setIsConfirmClearSentenceStructureAnnotationsDialogOpen,
  ] = useState(false);

  const {
    interactionState,
    handlePointerUpOutsideWord,
    handleSelectSentenceStructureElementVariant,
    handleSelectSentenceStructureElementUsage,
    handleUpdateSentenceElementName,
    handleDeleteSentenceStructureElement,
    handleStartModificationCreation,
    handleCancelModificationCreation,
    handleDeleteModification,
    handleStartCoordinationCreation,
    handleAddCoordinationPart,
    handleConfirmCoordinationCreation,
    handleCancelCoordinationCreation,
    handleDeleteCoordination,
  } = useInteractionState();

  useEffect(() => {
    function onPointerUpOutsideWord() {
      const result = handlePointerUpOutsideWord();
      if (!result.success) {
        alert(result.message);
      }
    }

    document.addEventListener("mouseup", onPointerUpOutsideWord);

    return () => {
      document.removeEventListener("mouseup", onPointerUpOutsideWord);
    };
  }, [handlePointerUpOutsideWord]);

  const sentenceStructureDiagramData = useMemo(
    () =>
      createSentenceStructureDiagramData(
        sentenceStructureDocument,
        resolvedSentenceStructureDiagramNotation,
        measureTextWidth,
      ),
    [sentenceStructureDocument, resolvedSentenceStructureDiagramNotation],
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setCanvasWidth(canvasRef.current?.getBoundingClientRect().width ?? 1000);
    });
    resizeObserver.observe(canvasRef.current);

    return () => resizeObserver.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, isTextEditing]);

  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Box sx={{ flex: 1, maxWidth: 1500, mx: 6 }}>
        <AppBar />
        <Box sx={{ flex: 1, my: 4 }}>
          {isTextEditing ? (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSentenceStructureDocument(
                      updateSentenceStructureDocumentText(
                        sentenceStructureDocument,
                        text,
                      ),
                    );
                    setIsTextEditing(false);
                  }}
                >
                  完了
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setIsTextEditing(false);
                  }}
                >
                  キャンセル
                </Button>
              </Stack>
              <TextField
                multiline
                minRows={6}
                fullWidth
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                }}
                placeholder="例：I like apples and bananas."
              />
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setText(
                        sentenceStructureDocumentToText(
                          sentenceStructureDocument,
                        ),
                      );
                      setIsTextEditing(true);
                    }}
                  >
                    テキストを編集
                  </Button>
                  <SplitButtons
                    options={[
                      {
                        key: "generate-sentence-structure-document",
                        label: "自動生成",
                        startIcon: <AutoAwesomeIcon />,
                        disabled: statusData?.status !== "ok",
                        loading:
                          generateSimplifiedSentenceStructureDocumentMutation.isPending,
                        loadingPosition: "start",
                        onClick: async () => {
                          try {
                            const newSimplifiedSentenceStructureDocument =
                              await generateSimplifiedSentenceStructureDocumentMutation.mutateAsync(
                                {
                                  text: sentenceStructureDocumentToText(
                                    sentenceStructureDocument,
                                  ),
                                },
                              );
                            setSentenceStructureDocument(
                              createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument(
                                newSimplifiedSentenceStructureDocument,
                              ),
                            );
                          } catch {
                            alert("自動生成に失敗しました。");
                          }
                        },
                      },
                      {
                        key: "revise-sentence-structure-document",
                        label: "AIで修正",
                        startIcon: <AutoAwesomeIcon />,
                        disabled: statusData?.status !== "ok",
                        loading:
                          reviseSimplifiedSentenceStructureDocumentMutation.isPending,
                        loadingPosition: "start",
                        onClick: () =>
                          setIsReviseSentenceStructureDocumentDialogOpen(true),
                      },
                    ]}
                  />
                  <ReviseSentenceStructureDocumentDialog
                    isOpen={isReviseSentenceStructureDocumentDialogOpen}
                    onClose={() =>
                      setIsReviseSentenceStructureDocumentDialogOpen(false)
                    }
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<ClearAllIcon />}
                    onClick={() =>
                      setIsConfirmClearSentenceStructureAnnotationsDialogOpen(
                        true,
                      )
                    }
                  >
                    全てクリア
                  </Button>
                  <ConfirmClearSentenceStructureAnnotationsDialog
                    isOpen={
                      isConfirmClearSentenceStructureAnnotationsDialogOpen
                    }
                    onClose={() =>
                      setIsConfirmClearSentenceStructureAnnotationsDialogOpen(
                        false,
                      )
                    }
                  />
                </Stack>
                <ToggleButtonGroup
                  value={annotationPresetName}
                  exclusive
                  size="small"
                  onChange={(_, newAnnotationPresetName) => {
                    if (newAnnotationPresetName === "non-reflow-annotation") {
                      setAnnotationPresetName("non-reflow-annotation");
                    } else if (
                      newAnnotationPresetName === "reflow-annotation"
                    ) {
                      setAnnotationPresetName("reflow-annotation");
                    }
                  }}
                >
                  <ToggleButton value="non-reflow-annotation">
                    原文配置
                  </ToggleButton>
                  <ToggleButton value="reflow-annotation">再配置</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
              <Paper variant="outlined" sx={{ position: "relative" }}>
                <Box ref={canvasRef}>
                  <SentenceStructureAnnotator />
                </Box>

                {interactionState.type === "span-action-selecting" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const endWordId =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.words.at(interactionState.endWordIndex)?.id ?? null;
                      if (!endWordId) {
                        throw new Error("End word not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementVariant({
                              kind: "core-sentence-element",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        文の主要素
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementVariant({
                              kind: "sentence-constituent",
                              type: "modifier-phrase",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {"(修飾語句)"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementVariant({
                              kind: "sentence-constituent",
                              type: "verbal-phrase",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {"<準動詞句>"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementVariant({
                              kind: "sentence-constituent",
                              type: "clause",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {"[節]"}
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartModificationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        修飾
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartCoordinationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        並列
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {interactionState.type ===
                  "sentence-structure-element-usage-selecting" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const endWordId =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.words.at(interactionState.endWordIndex)?.id ?? null;
                      if (!endWordId) {
                        throw new Error("End word not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementUsage({
                              usage: "nominal",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {interactionState.sentenceConstituentType ===
                        "verbal-phrase"
                          ? "名詞句"
                          : "名詞節"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementUsage({
                              usage: "adjectival",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {interactionState.sentenceConstituentType ===
                        "verbal-phrase"
                          ? "形容詞句"
                          : "形容詞節"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleSelectSentenceStructureElementUsage({
                              usage: "adverbial",
                            });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {interactionState.sentenceConstituentType ===
                        "verbal-phrase"
                          ? "副詞句"
                          : "副詞節"}
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {interactionState.type ===
                  "sentence-structure-element-selected" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const sentenceStructureElement =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.sentenceStructureElements.find(
                            (sentenceStructureElement) =>
                              sentenceStructureElement.id ===
                              interactionState.sentenceStructureElementId,
                          );
                      if (!sentenceStructureElement) {
                        throw new Error("Sentence structure element not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === sentenceStructureElement.endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      {(() => {
                        const sentenceStructureElement =
                          sentenceStructureDocument.sentences
                            .find(
                              (sentence) =>
                                sentence.id === interactionState.sentenceId,
                            )
                            ?.sentenceStructureElements.find(
                              (sentenceStructureElement) =>
                                sentenceStructureElement.id ===
                                interactionState.sentenceStructureElementId,
                            );
                        if (!sentenceStructureElement) {
                          throw new Error(
                            "Sentence structure element not found",
                          );
                        }

                        return (() => {
                          switch (sentenceStructureElement.kind) {
                            case "core-sentence-element": {
                              return allowedSentenceElementNameOptions[
                                "core-sentence-element"
                              ];
                            }
                            case "sentence-constituent": {
                              switch (sentenceStructureElement.type) {
                                case "verbal-phrase": {
                                  switch (sentenceStructureElement.usage) {
                                    case "nominal": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["verbal-phrase"]["nominal"];
                                    }
                                    case "adjectival": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["verbal-phrase"]["adjectival"];
                                    }
                                    case "adverbial": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["verbal-phrase"]["adverbial"];
                                    }
                                    default: {
                                      sentenceStructureElement satisfies never;
                                      throw new Error("Unreachable");
                                    }
                                  }
                                }
                                case "clause": {
                                  switch (sentenceStructureElement.usage) {
                                    case "nominal": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["clause"]["nominal"];
                                    }
                                    case "adjectival": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["clause"]["adjectival"];
                                    }
                                    case "adverbial": {
                                      return allowedSentenceElementNameOptions[
                                        "sentence-constituent"
                                      ]["clause"]["adverbial"];
                                    }
                                    default: {
                                      sentenceStructureElement satisfies never;
                                      throw new Error("Unreachable");
                                    }
                                  }
                                }
                                case "modifier-phrase": {
                                  return allowedSentenceElementNameOptions[
                                    "sentence-constituent"
                                  ]["modifier-phrase"];
                                }
                                default: {
                                  sentenceStructureElement satisfies never;
                                  throw new Error("Unreachable");
                                }
                              }
                            }
                            case "modification-element": {
                              return null;
                            }
                            default: {
                              sentenceStructureElement satisfies never;
                              throw new Error("Unreachable");
                            }
                          }
                        })()?.map((allowedSentenceElementNameOption) => (
                          <Button
                            key={allowedSentenceElementNameOption}
                            onClick={() => {
                              const result = handleUpdateSentenceElementName({
                                sentenceElementName:
                                  allowedSentenceElementNameOption,
                              });
                              if (!result.success) {
                                alert(result.message);
                              }
                            }}
                          >
                            {allowedSentenceElementNameOption}
                          </Button>
                        ));
                      })()}
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartModificationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        修飾
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartCoordinationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        並列
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleDeleteSentenceStructureElement();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        削除
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {(interactionState.type === "modification-modifier-selected" ||
                  interactionState.type ===
                    "modification-modified-span-selecting") && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const endWordId =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.words.at(
                            interactionState.modifierSentenceStructureElement
                              .endWordIndex,
                          )?.id ?? null;
                      if (!endWordId) {
                        throw new Error("End word not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result = handleCancelModificationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        キャンセル
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {interactionState.type === "modification-selected" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const modification = sentenceStructureDocument.sentences
                        .find(
                          (sentence) =>
                            sentence.id === interactionState.sentenceId,
                        )
                        ?.modifications.find(
                          (modification) =>
                            modification.id === interactionState.modificationId,
                        );
                      if (!modification) {
                        throw new Error("Modification not found");
                      }
                      const modifierSentenceStructureElement =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.sentenceStructureElements.find(
                            (sentenceStructureElement) =>
                              sentenceStructureElement.id ===
                              modification.modifierSentenceStructureElementId,
                          );
                      if (!modifierSentenceStructureElement) {
                        throw new Error(
                          "Modifier sentence structure element not found",
                        );
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId ===
                            modifierSentenceStructureElement.endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result = handleDeleteModification();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        修飾関係を削除
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {interactionState.type ===
                  "coordination-part-type-selecting" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const endWordId =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.words.at(interactionState.endWordIndex)?.id ?? null;
                      if (!endWordId) {
                        throw new Error("End word not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result = handleAddCoordinationPart({
                            coordinationPartType: "coordinator",
                          });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        等位接続詞
                      </Button>
                      <Button
                        onClick={() => {
                          const result = handleAddCoordinationPart({
                            coordinationPartType: "correlative",
                          });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        相関接続詞
                      </Button>
                      <Button
                        onClick={() => {
                          const result = handleAddCoordinationPart({
                            coordinationPartType: "conjunct",
                          });
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        並列要素
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {(interactionState.type === "coordination-parts-selected" ||
                  interactionState.type ===
                    "coordination-part-span-selecting") && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const endWordId =
                        sentenceStructureDocument.sentences
                          .find(
                            (sentence) =>
                              sentence.id === interactionState.sentenceId,
                          )
                          ?.words.at(
                            interactionState.coordinationParts.at(-1)!
                              .endWordIndex,
                          )?.id ?? null;
                      if (!endWordId) {
                        throw new Error("End word not found");
                      }
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result = handleConfirmCoordinationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        要素の選択を完了
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleCancelCoordinationCreation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        キャンセル
                      </Button>
                    </Paper>
                  </Popper>
                )}

                {interactionState.type === "coordination-selected" && (
                  <Popper
                    open={true}
                    anchorEl={() => {
                      const canvasElement = canvasRef.current;
                      if (!canvasElement) {
                        return {
                          getBoundingClientRect: () => new DOMRect(),
                        };
                      }

                      const coordination = sentenceStructureDocument.sentences
                        .find(
                          (sentence) =>
                            sentence.id === interactionState.sentenceId,
                        )
                        ?.coordinations.find(
                          (coordination) =>
                            coordination.id === interactionState.coordinationId,
                        );
                      if (!coordination) {
                        throw new Error("Coordination not found");
                      }
                      const endWordId = coordination.parts.at(-1)!.endWordId;
                      const endWord = sentenceStructureDiagramData.words.find(
                        (word) =>
                          word.sentenceId === interactionState.sentenceId &&
                          word.wordId === endWordId,
                      );
                      if (!endWord) {
                        throw new Error("End word not found");
                      }

                      const canvasRectangle =
                        canvasElement.getBoundingClientRect();
                      return {
                        getBoundingClientRect: () => {
                          return new DOMRect(
                            canvasRectangle.left + endWord.rectangle.x,
                            canvasRectangle.top + endWord.rectangle.y,
                            endWord.rectangle.width,
                            endWord.rectangle.height,
                          );
                        },
                      };
                    }}
                    placement="top"
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    <Paper sx={{ display: "flex", whiteSpace: "nowrap" }}>
                      <Button
                        onClick={() => {
                          const result = handleDeleteCoordination();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        並列関係を削除
                      </Button>
                    </Paper>
                  </Popper>
                )}
              </Paper>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
