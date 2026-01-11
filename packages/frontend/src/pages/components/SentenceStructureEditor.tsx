import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";
import {
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  ClearAll as ClearAllIcon,
  EditNote as EditNoteIcon,
  Schema as SchemaIcon,
} from "@mui/icons-material";
import {
  coordinationChildTypeOptions,
  createSentenceStructureDataFromSimplifiedAnnotationData,
  createSentenceStructureDataFromText,
  findCoordinationById,
  findRangeById,
  findRelationById,
  sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap,
  sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap,
  type CoordinationChildType,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import { convertSentenceStructureDataToSentenceStructureDiagramData } from "@sentence-structure-diagram-app/sentence-structure-diagram-data";
import { useSentenceStructureData } from "../contexts/SentenceStructureDataProvider";
import { useInteractionState } from "../contexts/InteractionStateProvider";
import { measureTextWidth } from "../utils/measure-text-width";
import AppBar from "./AppBar";
import ConfirmClearAnnotationsDialog from "./ConfirmClearAnnotationsDialog";
import ConfirmClearAllDialog from "./ConfirmClearAllDialog";
import SentenceStructureDiagramAnnotator from "./SentenceStructureDiagramAnnotator";

type ViewMode = "edit" | "annotate";

export default function SentenceStructureEditor() {
  const [viewMode, _setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = localStorage.getItem("viewMode");
    if (savedViewMode === "annotate") return "annotate";
    return "edit";
  });
  function setViewMode(newViewMode: ViewMode) {
    localStorage.setItem("viewMode", newViewMode);
    _setViewMode(newViewMode);
  }
  const [
    isConfirmClearAnnotationsDialogOpen,
    setIsConfirmClearAnnotationsDialogOpen,
  ] = useState(false);
  const [isConfirmClearAllDialogOpen, setIsConfirmClearAllDialogOpen] =
    useState(false);

  const { data: statusData } = useQuery(trpc.status.queryOptions());
  const generateSentenceStructureMutation = useMutation(
    trpc.generateSentenceStructure.mutationOptions(),
  );

  const { sentenceStructureData, setSentenceStructureData } =
    useSentenceStructureData();

  const {
    interactionState,
    handleMouseUpOutsideWord,
    handleCreateSentenceElementRange,
    handleCreateSentenceStructureRange,
    handleUpdateSentenceElementName,
    handleDeleteRange,
    handleStartCreatingRelation,
    handleCancelCreatingRelation,
    handleDeleteRelation,
    handleStartCreatingCoordination,
    handleCreateCoordinationChild,
    handleConfirmCreatingCoordination,
    handleCancelCreatingCoordination,
    handleDeleteCoordination,
  } = useInteractionState();
  useEffect(() => {
    function onMouseUp() {
      const result = handleMouseUpOutsideWord();
      if (!result.success) {
        alert(result.message);
      }
    }
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [handleMouseUpOutsideWord]);

  const canvasRef = useRef<SVGSVGElement | null>(null);
  const [maxWidth, setMaxWidth] = useState(1000);
  useEffect(() => {
    if (!canvasRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      setMaxWidth(canvasRef.current?.getBoundingClientRect().width ?? 0);
    });
    resizeObserver.observe(canvasRef.current);

    return () => resizeObserver.disconnect();
  }, [canvasRef, setMaxWidth, viewMode]);

  const sentenceStructureDiagramData =
    convertSentenceStructureDataToSentenceStructureDiagramData(
      sentenceStructureData,
      maxWidth,
      measureTextWidth,
      {
        layoutMode: "linear",
      },
    );

  return (
    <>
      <AppBar />
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Box sx={{ flex: 1, maxWidth: 1200, mx: 8, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newValue: ViewMode) => {
                if (
                  newValue === "edit" &&
                  (sentenceStructureData.ranges.length !== 0 ||
                    sentenceStructureData.relations.length !== 0 ||
                    sentenceStructureData.coordinations.length !== 0)
                ) {
                  setIsConfirmClearAnnotationsDialogOpen(true);
                  return;
                }
                setViewMode(newValue);
              }}
              sx={{ flex: 1 }}
            >
              <ToggleButton value="edit">
                <Tooltip title="テキスト編集モード">
                  <EditNoteIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="annotate">
                <Tooltip title="注釈モード">
                  <SchemaIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <ConfirmClearAnnotationsDialog
              isOpen={isConfirmClearAnnotationsDialogOpen}
              onClose={() => setIsConfirmClearAnnotationsDialogOpen(false)}
              onConfirm={() => {
                setIsConfirmClearAnnotationsDialogOpen(false);
                setViewMode("edit");
              }}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<AutoAwesomeIcon />}
                disabled={statusData?.status !== "ok"}
                loading={generateSentenceStructureMutation.isPending}
                loadingPosition="start"
                onClick={async () => {
                  try {
                    const result =
                      await generateSentenceStructureMutation.mutateAsync({
                        text: sentenceStructureData.text,
                        words: sentenceStructureData.words.map(
                          (word) => word.text,
                        ),
                      });

                    const newSentenceStructureData =
                      createSentenceStructureDataFromSimplifiedAnnotationData(
                        sentenceStructureData.text,
                        result,
                      );
                    if (!newSentenceStructureData.success)
                      throw new Error("Invalid generated data");
                    setSentenceStructureData(
                      newSentenceStructureData.data.newSentenceStructureData,
                    );
                  } catch {
                    alert("自動生成に失敗しました。");
                  }
                }}
              >
                自動生成
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ClearAllIcon />}
                onClick={() => setIsConfirmClearAllDialogOpen(true)}
              >
                全てクリア
              </Button>
              <ConfirmClearAllDialog
                isOpen={isConfirmClearAllDialogOpen}
                onClose={() => setIsConfirmClearAllDialogOpen(false)}
              />
            </Box>
          </Box>
          {viewMode === "edit" ? (
            <TextField
              multiline
              minRows={6}
              fullWidth
              value={sentenceStructureData.text}
              onChange={(e) => {
                setSentenceStructureData(
                  createSentenceStructureDataFromText({ text: e.target.value }),
                );
              }}
              placeholder="ここに英文を入力してください。"
            />
          ) : (
            <Paper variant="outlined" sx={{ position: "relative" }}>
              <Box ref={canvasRef}>
                <SentenceStructureDiagramAnnotator
                  sentenceStructureDiagramData={sentenceStructureDiagramData}
                />
              </Box>

              {/* 範囲の作成 */}
              {interactionState.type === "range-confirming" &&
                (() => {
                  const endWord =
                    sentenceStructureDiagramData.words[
                      interactionState.endWordIndex
                    ];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={() => {
                          const result = handleCreateSentenceElementRange(
                            "core-sentence-element",
                          );
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
                            handleCreateSentenceStructureRange("modifier");
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {"(修飾語)"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleCreateSentenceStructureRange("phrase");
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        {"<句>"}
                      </Button>
                      <Button
                        onClick={() => {
                          const result =
                            handleCreateSentenceStructureRange("clause");
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
                          const result = handleStartCreatingRelation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        矢印
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartCreatingCoordination();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        並列
                      </Button>
                    </Paper>
                  );
                })()}

              {/* 文の要素の付与 */}
              {interactionState.type === "range-selected" &&
                (() => {
                  const activeRange = findRangeById(sentenceStructureData, {
                    rangeId: interactionState.rangeId,
                  });
                  if (activeRange === null)
                    throw new Error("Active range not found");
                  const endWord =
                    sentenceStructureDiagramData.words[
                      activeRange.endWordIndex
                    ];
                  return (
                    <Paper
                      elevation={3}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                      onMouseUp={(e) => e.stopPropagation()}
                    >
                      {(activeRange.kind === "sentence-element"
                        ? sentenceElementRangeTypeToAllowedSentenceElementNameOptionsMap[
                            activeRange.type
                          ]
                        : activeRange.kind === "sentence-structure"
                          ? sentenceStructureRangeTypeToAllowedSentenceElementNameOptionsMap[
                              activeRange.type
                            ]
                          : null
                      )?.map((allowedSentenceElement) => (
                        <Button
                          key={allowedSentenceElement}
                          onClick={() => {
                            const result = handleUpdateSentenceElementName(
                              allowedSentenceElement,
                            );
                            if (!result.success) {
                              alert(result.message);
                            }
                          }}
                        >
                          {allowedSentenceElement}
                        </Button>
                      ))}
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartCreatingRelation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        矢印
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleStartCreatingCoordination();
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
                          const result = handleDeleteRange();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        削除
                      </Button>
                    </Paper>
                  );
                })()}

              {/* 矢印の作成のキャンセル */}
              {(interactionState.type === "relation-idle" ||
                interactionState.type === "relation-selecting") &&
                (() => {
                  const endWord =
                    sentenceStructureDiagramData.words[
                      interactionState.fromRange.endWordIndex
                    ];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={() => {
                          const result = handleCancelCreatingRelation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        キャンセル
                      </Button>
                    </Paper>
                  );
                })()}

              {/* 矢印の削除 */}
              {interactionState.type === "relation-selected" &&
                (() => {
                  const activeRelation = findRelationById(
                    sentenceStructureData,
                    {
                      relationId: interactionState.relationId,
                    },
                  );
                  if (activeRelation === null)
                    throw new Error("Active relation not found");
                  const fromRange = findRangeById(sentenceStructureData, {
                    rangeId: activeRelation.fromRangeId,
                  });
                  if (fromRange === null)
                    throw new Error("From range not found");
                  const endWord =
                    sentenceStructureDiagramData.words[fromRange.endWordIndex];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={() => {
                          const result = handleDeleteRelation();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        矢印を削除
                      </Button>
                    </Paper>
                  );
                })()}

              {/* 並列の要素の作成 */}
              {interactionState.type === "coordination-confirming" &&
                (() => {
                  const endWord =
                    sentenceStructureDiagramData.words[
                      interactionState.endWordIndex
                    ];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {coordinationChildTypeOptions.map(
                        (coordinationChildType) => (
                          <Button
                            key={coordinationChildType}
                            onClick={() => {
                              const result = handleCreateCoordinationChild(
                                coordinationChildType,
                              );
                              if (!result.success) {
                                alert(result.message);
                              }
                            }}
                          >
                            {
                              (
                                {
                                  "coordinating conjunction": "等位接続詞",
                                  "correlative conjunction": "相関接続詞",
                                  conjunct: "並列要素",
                                } satisfies Record<
                                  CoordinationChildType,
                                  string
                                >
                              )[coordinationChildType]
                            }
                          </Button>
                        ),
                      )}
                    </Paper>
                  );
                })()}

              {/* 並列の作成のキャンセル */}
              {(interactionState.type === "coordination-idle" ||
                interactionState.type === "coordination-selecting") &&
                (() => {
                  const endWord =
                    sentenceStructureDiagramData.words[
                      interactionState.children[0].endWordIndex
                    ];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={() => {
                          const result = handleConfirmCreatingCoordination();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        すべての要素の選択を完了
                      </Button>
                      <Divider orientation="vertical" flexItem />
                      <Button
                        onClick={() => {
                          const result = handleCancelCreatingCoordination();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                      >
                        キャンセル
                      </Button>
                    </Paper>
                  );
                })()}

              {/* 並列の削除 */}
              {interactionState.type === "coordination-selected" &&
                (() => {
                  const activeCoordination = findCoordinationById(
                    sentenceStructureData,
                    {
                      coordinationId: interactionState.coordinationId,
                    },
                  );
                  if (activeCoordination === null)
                    throw new Error("Active coordination not found");
                  const endChild = activeCoordination.children.at(-1);
                  if (endChild == null) throw new Error("End child not found");
                  const endWord =
                    sentenceStructureDiagramData.words[endChild.endWordIndex];
                  return (
                    <Paper
                      elevation={3}
                      onMouseUp={(e) => e.stopPropagation()}
                      sx={{
                        position: "absolute",
                        left:
                          (endWord.position.left + endWord.position.right) / 2,
                        top: endWord.position.top - 8,
                        translate: "-50% -100%",
                        display: "flex",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={() => {
                          const result = handleDeleteCoordination();
                          if (!result.success) {
                            alert(result.message);
                          }
                        }}
                        color="error"
                      >
                        並列を削除
                      </Button>
                    </Paper>
                  );
                })()}
            </Paper>
          )}
        </Box>
      </Box>
    </>
  );
}
