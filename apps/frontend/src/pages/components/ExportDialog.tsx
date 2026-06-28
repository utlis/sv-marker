import { useMemo } from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  Input,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { sentenceElementNameOptions } from "@sv-marker/sentence-structure-document";
import {
  bracketTypeOptions,
  colorOptions,
  labelPlacementOptions,
  lineStyleOptions,
  presets,
  type RangeMarker,
} from "@sv-marker/sentence-structure-diagram-notation";
import { createSentenceStructureDiagramSVGString } from "@sv-marker/sentence-structure-diagram";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";
import { useSentenceStructureDiagramDisplaySettings } from "../contexts/SentenceStructureDiagramDisplaySettingsProvider";
import { measureTextWidth } from "../utils/measure-text-width";

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const { sentenceStructureDocument } = useSentenceStructureDocument();

  const {
    resolvedSentenceStructureDiagramNotation,
    sentenceStructureDiagramDisplaySettings,
    setSentenceStructureDiagramDisplaySettings,
  } = useSentenceStructureDiagramDisplaySettings();

  const sentenceStructureDiagramSvgString = useMemo(
    () =>
      createSentenceStructureDiagramSVGString(
        sentenceStructureDocument,
        resolvedSentenceStructureDiagramNotation,
        measureTextWidth,
      ),
    [sentenceStructureDocument, resolvedSentenceStructureDiagramNotation],
  );

  return (
    <Dialog fullScreen open={isOpen} onClose={onClose}>
      <AppBar position="static" color="default">
        <Toolbar>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <IconButton edge="start" onClick={onClose}>
              <CloseIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flex: 1 }}>
              エクスポート
            </Typography>
            <Button
              autoFocus
              onClick={() => {
                const blob = new Blob([sentenceStructureDiagramSvgString], {
                  type: "image/svg+xml",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "sentence-structure-diagram.svg";
                a.click();
                URL.revokeObjectURL(url);
                onClose();
              }}
            >
              エクスポート
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Stack flexDirection="row" sx={{ overflow: "hidden" }}>
        <Paper variant="outlined" sx={{ flex: 2, overflow: "auto", m: 4 }}>
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
              sentenceStructureDiagramSvgString,
            )}`}
          />
        </Paper>
        <Box sx={{ m: 4, p: 2, flex: 1, overflow: "auto" }}>
          <Stack gap={2}>
            <Typography variant="h6" component="div">
              キャンバス幅
            </Typography>
            <Stack direction="row" gap={1}>
              <Slider
                value={resolvedSentenceStructureDiagramNotation.canvas.width}
                onChange={(_, newValue) => {
                  const newSentenceStructureDiagramNotation = {
                    ...resolvedSentenceStructureDiagramNotation,
                  };
                  newSentenceStructureDiagramNotation.canvas.width =
                    newValue as number;
                  setSentenceStructureDiagramDisplaySettings({
                    presetName: null,
                    sentenceStructureDiagramNotation:
                      newSentenceStructureDiagramNotation,
                  });
                }}
                step={100}
                min={500}
                max={1500}
                valueLabelDisplay="auto"
              />
              <Input
                size="small"
                value={resolvedSentenceStructureDiagramNotation.canvas.width}
                onChange={(e) => {
                  const newSentenceStructureDiagramNotation = {
                    ...resolvedSentenceStructureDiagramNotation,
                  };
                  newSentenceStructureDiagramNotation.canvas.width = Number(
                    e.target.value,
                  );
                  setSentenceStructureDiagramDisplaySettings({
                    presetName: null,
                    sentenceStructureDiagramNotation:
                      newSentenceStructureDiagramNotation,
                  });
                }}
                inputProps={{
                  step: 100,
                  min: 500,
                  max: 1500,
                  type: "number",
                }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={2}>
            <Typography variant="h6" component="div">
              構造図の表記規約
            </Typography>
            <FormControl>
              <InputLabel>構造図の表記規約</InputLabel>
              <Select
                label="構造図の表記規約"
                value={
                  sentenceStructureDiagramDisplaySettings.presetName ?? "custom"
                }
                onChange={(e) => {
                  const presetName = e.target.value as
                    | keyof typeof presets
                    | "custom";

                  if (presetName === "custom") {
                    setSentenceStructureDiagramDisplaySettings({
                      presetName: null,
                      sentenceStructureDiagramNotation: {
                        ...resolvedSentenceStructureDiagramNotation,
                      },
                    });
                  } else {
                    setSentenceStructureDiagramDisplaySettings({
                      presetName,
                    });
                  }
                }}
              >
                {(
                  [
                    {
                      presetName: "non-reflow-diagram",
                      label: "原文配置",
                    },
                    {
                      presetName: "reflow-diagram",
                      label: "再配置",
                    },
                    {
                      presetName: "non-reflow-annotation",
                      label: "原文配置（準動詞句・節名付き）",
                    },
                    {
                      presetName: "reflow-annotation",
                      label: "再配置（準動詞句・節名付き）",
                    },
                    {
                      presetName: "custom",
                      label: "自分で設定する",
                    },
                  ] satisfies {
                    presetName: keyof typeof presets | "custom";
                    label: string;
                  }[]
                ).map(({ presetName: value, label }) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {sentenceStructureDiagramDisplaySettings.presetName === null && (
            <>
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  色
                </Typography>
                <Stack direction="row" gap={1}>
                  <TextField
                    type="color"
                    variant="outlined"
                    label="強調色"
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.colors
                        .primary
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.colors.primary =
                        e.target.value as `#${string}`;
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    type="color"
                    variant="outlined"
                    label="文字色"
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.colors.text
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.colors.text = e
                        .target.value as `#${string}`;
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    sx={{ minWidth: 140 }}
                  />
                  <TextField
                    type="color"
                    variant="outlined"
                    label="背景色"
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.colors
                        .background
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.colors.background =
                        e.target.value as `#${string}`;
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    sx={{ minWidth: 140 }}
                  />
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文字サイズ
                </Typography>
                <Stack direction="row" gap={1}>
                  <Slider
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.typography
                        .fontSize
                    }
                    onChange={(_, newValue) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.typography.fontSize =
                        newValue as number;
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    step={1}
                    min={12}
                    max={48}
                    valueLabelDisplay="auto"
                  />
                  <Input
                    size="small"
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.typography
                        .fontSize
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.typography.fontSize =
                        Number(e.target.value);
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    inputProps={{
                      step: 1,
                      min: 12,
                      max: 48,
                      type: "number",
                    }}
                  />
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={1}>
                <Typography variant="h6" component="div">
                  間隔
                </Typography>
                <Typography variant="subtitle1" component="div">
                  周囲の余白
                </Typography>
                <Stack direction="row" gap={1}>
                  <Slider
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.spacing
                        .padding
                    }
                    onChange={(_, newValue) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.spacing.padding =
                        newValue as number;
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    step={4}
                    min={0}
                    max={128}
                    valueLabelDisplay="auto"
                  />
                  <Input
                    size="small"
                    value={
                      resolvedSentenceStructureDiagramNotation.theme.spacing
                        .padding
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.theme.spacing.padding =
                        Number(e.target.value);
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    inputProps={{
                      step: 4,
                      min: 0,
                      max: 128,
                      type: "number",
                    }}
                  />
                </Stack>
                <Stack gap={1}>
                  <Typography variant="subtitle1" component="div">
                    単語間隔
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Slider
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .wordSpacing
                      }
                      onChange={(_, newValue) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.wordSpacing =
                          newValue as number;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      step={4}
                      min={0}
                      max={64}
                      valueLabelDisplay="auto"
                    />
                    <Input
                      size="small"
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .wordSpacing
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.wordSpacing =
                          Number(e.target.value);
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      inputProps={{
                        step: 4,
                        min: 0,
                        max: 64,
                        type: "number",
                      }}
                    />
                  </Stack>
                </Stack>
                <Stack gap={1}>
                  <Typography variant="subtitle1" component="div">
                    行間
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Slider
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .lineSpacing
                      }
                      onChange={(_, newValue) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.lineSpacing =
                          newValue as number;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      step={4}
                      min={0}
                      max={128}
                      valueLabelDisplay="auto"
                    />
                    <Input
                      size="small"
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .lineSpacing
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.lineSpacing =
                          Number(e.target.value);
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      inputProps={{
                        step: 4,
                        min: 0,
                        max: 128,
                        type: "number",
                      }}
                    />
                  </Stack>
                </Stack>
                <Stack gap={1}>
                  <Typography variant="subtitle1" component="div">
                    折り返し行の字下げ
                  </Typography>
                  <Stack direction="row" gap={1}>
                    <Slider
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .continuationIndent
                      }
                      onChange={(_, newValue) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.continuationIndent =
                          newValue as number;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      step={4}
                      min={0}
                      max={64}
                      valueLabelDisplay="auto"
                    />
                    <Input
                      size="small"
                      value={
                        resolvedSentenceStructureDiagramNotation.theme.spacing
                          .continuationIndent
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.theme.spacing.continuationIndent =
                          Number(e.target.value);
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      inputProps={{
                        step: 4,
                        min: 0,
                        max: 64,
                        type: "number",
                      }}
                    />
                  </Stack>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        resolvedSentenceStructureDiagramNotation.enableReflow
                      }
                      onChange={(e) => {
                        if (
                          e.target.checked ===
                          resolvedSentenceStructureDiagramNotation.enableReflow
                        ) {
                          return;
                        }

                        if (!e.target.checked) {
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation: {
                              ...resolvedSentenceStructureDiagramNotation,
                              enableReflow: false,
                              coordinationNotation: {
                                ...resolvedSentenceStructureDiagramNotation.coordinationNotation,
                                layout: {
                                  ...resolvedSentenceStructureDiagramNotation
                                    .coordinationNotation.layout,
                                  direction: "horizontal",
                                },
                                groupIndicator:
                                  resolvedSentenceStructureDiagramNotation
                                    .coordinationNotation.groupIndicator
                                    .type === "none" ||
                                  resolvedSentenceStructureDiagramNotation
                                    .coordinationNotation.groupIndicator
                                    .type === "bus-connector"
                                    ? resolvedSentenceStructureDiagramNotation
                                        .coordinationNotation.groupIndicator
                                    : {
                                        type: "bus-connector",
                                        color:
                                          resolvedSentenceStructureDiagramNotation
                                            .coordinationNotation.groupIndicator
                                            .color,
                                      },
                              },
                            },
                          });
                        } else {
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation: {
                              ...resolvedSentenceStructureDiagramNotation,
                              enableReflow: true,
                              coordinationNotation: {
                                ...resolvedSentenceStructureDiagramNotation.coordinationNotation,
                                layout: {
                                  ...resolvedSentenceStructureDiagramNotation
                                    .coordinationNotation.layout,
                                  direction: "vertical",
                                },
                              },
                              layoutStrategy: {
                                lineBreakStrategy: "largest-boundary-first",
                                continuationLineStart: "scope-start",
                              },
                            },
                          });
                        }
                      }}
                    />
                  }
                  label="再配置"
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  範囲表示
                </Typography>
                {(
                  [
                    {
                      label: "文の主要素",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .coreSentenceElement,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.coreSentenceElement =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "名詞句",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.verbalPhrase.nominal,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.verbalPhrase.nominal =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "形容詞句",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.verbalPhrase.adjectival,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.verbalPhrase.adjectival =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "副詞句",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.verbalPhrase.adverbial,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.verbalPhrase.adverbial =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "名詞節",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.clause.nominal,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.clause.nominal =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "形容詞節",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.clause.adjectival,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.clause.adjectival =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "副詞節",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.clause.adverbial,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.clause.adverbial =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "修飾語句",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .sentenceConstituent.modifierPhrase,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.sentenceConstituent.modifierPhrase =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "修飾関係の要素",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation.rangeMarking
                          .modificationElement,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.rangeMarking.modificationElement =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                  ] satisfies {
                    label: string;
                    rangeMarker: RangeMarker;
                    onChange: (newRangeMarker: RangeMarker) => void;
                  }[]
                ).map(({ label, rangeMarker, onChange }) => (
                  <Stack key={label} gap={1}>
                    <Typography variant="subtitle1" component="div">
                      {label}
                    </Typography>
                    <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                      <FormControl>
                        <InputLabel>種類</InputLabel>
                        <Select
                          label="種類"
                          value={rangeMarker.type}
                          onChange={(e) => {
                            const rangeMarkerType = e.target
                              .value as RangeMarker["type"];

                            switch (rangeMarkerType) {
                              case "underline": {
                                onChange({
                                  type: "underline",
                                  lineStyle:
                                    rangeMarker.type === "underline"
                                      ? rangeMarker.lineStyle
                                      : "solid",
                                  color:
                                    rangeMarker.type === "underline"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "bracket": {
                                onChange({
                                  type: "bracket",
                                  bracketType:
                                    rangeMarker.type === "bracket"
                                      ? rangeMarker.bracketType
                                      : "parenthesis",
                                  color:
                                    rangeMarker.type === "bracket"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "box":
                              case "text-emphasis": {
                                onChange({
                                  type: rangeMarkerType,
                                  color:
                                    rangeMarker.type === "box" ||
                                    rangeMarker.type === "text-emphasis"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "highlight": {
                                onChange({
                                  type: rangeMarkerType,
                                  color:
                                    rangeMarker.type === "highlight"
                                      ? rangeMarker.color
                                      : "background",
                                });
                                break;
                              }
                              case "bold":
                              case "none": {
                                onChange({
                                  type: rangeMarkerType,
                                });
                                break;
                              }
                              default: {
                                rangeMarkerType satisfies never;
                                throw new Error("Unreachable");
                              }
                            }
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="underline">下線</MenuItem>
                          <MenuItem value="bracket">括弧</MenuItem>
                          <MenuItem value="box">囲み</MenuItem>
                          <MenuItem value="text-emphasis">文字強調</MenuItem>
                          <MenuItem value="highlight">ハイライト</MenuItem>
                          <MenuItem value="bold">太字</MenuItem>
                          <MenuItem value="none">なし</MenuItem>
                        </Select>
                      </FormControl>

                      {(() => {
                        switch (rangeMarker.type) {
                          case "underline": {
                            return (
                              <>
                                <FormControl>
                                  <InputLabel>線種</InputLabel>
                                  <Select
                                    label="線種"
                                    value={rangeMarker.lineStyle}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        lineStyle: e.target
                                          .value as (typeof lineStyleOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {lineStyleOptions.map((lineStyleOption) => (
                                      <MenuItem
                                        key={lineStyleOption}
                                        value={lineStyleOption}
                                      >
                                        {(() => {
                                          switch (lineStyleOption) {
                                            case "solid":
                                              return "実線";
                                            case "dashed":
                                              return "破線";
                                            default:
                                              lineStyleOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl>
                                  <InputLabel>色</InputLabel>
                                  <Select
                                    label="色"
                                    value={rangeMarker.color}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        color: e.target
                                          .value as (typeof colorOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {colorOptions.map((colorOption) => (
                                      <MenuItem
                                        key={colorOption}
                                        value={colorOption}
                                      >
                                        {(() => {
                                          switch (colorOption) {
                                            case "primary":
                                              return "強調色";
                                            case "text":
                                              return "文字色";
                                            case "background":
                                              return "背景色";
                                            default:
                                              colorOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            );
                          }
                          case "bracket": {
                            return (
                              <>
                                <FormControl>
                                  <InputLabel>括弧</InputLabel>
                                  <Select
                                    label="括弧"
                                    value={rangeMarker.bracketType}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        bracketType: e.target
                                          .value as (typeof bracketTypeOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {bracketTypeOptions.map(
                                      (bracketTypeOption) => (
                                        <MenuItem
                                          key={bracketTypeOption}
                                          value={bracketTypeOption}
                                        >
                                          {(() => {
                                            switch (bracketTypeOption) {
                                              case "parenthesis":
                                                return "小括弧";
                                              case "angle-bracket":
                                                return "山括弧";
                                              case "curly-bracket":
                                                return "中括弧";
                                              case "square-bracket":
                                                return "大括弧";
                                              default:
                                                bracketTypeOption satisfies never;
                                                throw new Error("Unreachable");
                                            }
                                          })()}
                                        </MenuItem>
                                      ),
                                    )}
                                  </Select>
                                </FormControl>
                                <FormControl>
                                  <InputLabel>色</InputLabel>
                                  <Select
                                    label="色"
                                    value={rangeMarker.color}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        color: e.target
                                          .value as (typeof colorOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {colorOptions.map((colorOption) => (
                                      <MenuItem
                                        key={colorOption}
                                        value={colorOption}
                                      >
                                        {(() => {
                                          switch (colorOption) {
                                            case "primary":
                                              return "強調色";
                                            case "text":
                                              return "文字色";
                                            case "background":
                                              return "背景色";
                                            default:
                                              colorOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            );
                          }
                          case "box":
                          case "text-emphasis":
                          case "highlight": {
                            return (
                              <FormControl>
                                <InputLabel>色</InputLabel>
                                <Select
                                  label="色"
                                  value={rangeMarker.color}
                                  onChange={(e) =>
                                    onChange({
                                      ...rangeMarker,
                                      color: e.target
                                        .value as (typeof colorOptions)[number],
                                    })
                                  }
                                  sx={{ minWidth: 120 }}
                                >
                                  {colorOptions.map((colorOption) => (
                                    <MenuItem
                                      key={colorOption}
                                      value={colorOption}
                                    >
                                      {(() => {
                                        switch (colorOption) {
                                          case "primary":
                                            return "強調色";
                                          case "text":
                                            return "文字色";
                                          case "background":
                                            return "背景色";
                                          default:
                                            colorOption satisfies never;
                                            throw new Error("Unreachable");
                                        }
                                      })()}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            );
                          }
                        }
                      })()}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の要素ラベル
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {sentenceElementNameOptions.map((sentenceElementName) => (
                    <TextField
                      key={sentenceElementName}
                      variant="outlined"
                      label={(() => {
                        switch (sentenceElementName) {
                          case "S":
                            return "主語";
                          case "V":
                            return "動詞";
                          case "O":
                            return "目的語";
                          case "C":
                            return "補語";
                          case "M":
                            return "修飾語";
                          default:
                            sentenceElementName satisfies never;
                            throw new Error("Unreachable");
                        }
                      })()}
                      value={
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation
                          .sentenceElementLabeling.labels[sentenceElementName]
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.labels[
                          sentenceElementName
                        ] = e.target.value;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      sx={{ minWidth: 120 }}
                    />
                  ))}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の要素ラベルの位置
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {(
                    [
                      {
                        label: "文の主要素",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .coreSentenceElement,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.coreSentenceElement =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "名詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.verbalPhrase.nominal,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.verbalPhrase.nominal =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.verbalPhrase.adjectival,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.verbalPhrase.adjectival =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.verbalPhrase.adverbial,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.verbalPhrase.adverbial =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "名詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.clause.nominal,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.clause.nominal =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.clause.adjectival,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.clause.adjectival =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.clause.adverbial,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.clause.adverbial =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "修飾語句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceElementLabeling.placement
                            .sentenceConstituent.modifierPhrase,
                        onChange: (
                          newLabelPlacement: (typeof labelPlacementOptions)[number],
                        ) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.placement.sentenceConstituent.modifierPhrase =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                    ] satisfies {
                      label: string;
                      labelPlacement: (typeof labelPlacementOptions)[number];
                      onChange: (
                        newLabelPlacement: (typeof labelPlacementOptions)[number],
                      ) => void;
                    }[]
                  ).map(({ label, labelPlacement, onChange }) => (
                    <FormControl key={label}>
                      <InputLabel>{label}</InputLabel>
                      <Select
                        label={label}
                        value={labelPlacement}
                        onChange={(e) =>
                          onChange(
                            e.target
                              .value as (typeof labelPlacementOptions)[number],
                          )
                        }
                        sx={{ minWidth: 120 }}
                      >
                        {labelPlacementOptions.map((labelPlacementOption) => (
                          <MenuItem
                            key={labelPlacementOption}
                            value={labelPlacementOption}
                          >
                            {(() => {
                              switch (labelPlacementOption) {
                                case "below-center":
                                  return "中央下";
                                case "below-left":
                                  return "左下";
                                case "above-center":
                                  return "中央上";
                                case "above-left":
                                  return "左上";
                                default:
                                  labelPlacementOption satisfies never;
                                  throw new Error("Unreachable");
                              }
                            })()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の要素ラベルの色
                </Typography>
                <FormControl>
                  <InputLabel>色</InputLabel>
                  <Select
                    label="色"
                    value={
                      resolvedSentenceStructureDiagramNotation
                        .sentenceStructureElementNotation
                        .sentenceElementLabeling.color
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.color =
                        e.target.value as (typeof colorOptions)[number];
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    sx={{ minWidth: 120 }}
                  >
                    {colorOptions.map((colorOption) => (
                      <MenuItem key={colorOption} value={colorOption}>
                        {(() => {
                          switch (colorOption) {
                            case "primary":
                              return "強調色";
                            case "text":
                              return "文字色";
                            case "background":
                              return "背景色";
                            default:
                              colorOption satisfies never;
                              throw new Error("Unreachable");
                          }
                        })()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の要素ラベルの付加情報
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation
                          .sentenceElementLabeling.labelSuffixes
                          .showNestingDepthPrimes
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.labelSuffixes.showNestingDepthPrimes =
                          e.target.checked;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                    />
                  }
                  label="入れ子の深さをプライム記号で表示"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        resolvedSentenceStructureDiagramNotation
                          .sentenceStructureElementNotation
                          .sentenceElementLabeling.labelSuffixes
                          .showConjunctNumbering
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceElementLabeling.labelSuffixes.showConjunctNumbering =
                          e.target.checked;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                    />
                  }
                  label="並列要素の番号を表示"
                />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の構成要素ラベル
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {(
                    [
                      {
                        label: "名詞句",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.verbalPhrase
                            .nominal,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.verbalPhrase.nominal =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞句",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.verbalPhrase
                            .adjectival,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.verbalPhrase.adjectival =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞句",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.verbalPhrase
                            .adverbial,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.verbalPhrase.adverbial =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "名詞節",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.clause.nominal,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.clause.nominal =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞節",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.clause
                            .adjectival,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.clause.adjectival =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞節",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.clause
                            .adverbial,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.clause.adverbial =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "修飾語句",
                        sentenceConstituentLabel:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.labels.modifierPhrase,
                        onChange: (newSentenceConstituentLabel) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.labels.modifierPhrase =
                            newSentenceConstituentLabel;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                    ] satisfies {
                      label: string;
                      sentenceConstituentLabel: string;
                      onChange: (newSentenceConstituentLabel: string) => void;
                    }[]
                  ).map(({ label, sentenceConstituentLabel, onChange }) => (
                    <TextField
                      key={label}
                      variant="outlined"
                      label={label}
                      value={sentenceConstituentLabel}
                      onChange={(e) => onChange(e.target.value)}
                      sx={{ minWidth: 120 }}
                    />
                  ))}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の構成要素ラベルの位置
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {(
                    [
                      {
                        label: "名詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.verbalPhrase
                            .nominal,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.verbalPhrase.nominal =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.verbalPhrase
                            .adjectival,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.verbalPhrase.adjectival =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.verbalPhrase
                            .adverbial,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.verbalPhrase.adverbial =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "名詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.clause
                            .nominal,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.clause.nominal =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "形容詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.clause
                            .adjectival,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.clause.adjectival =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "副詞節",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement.clause
                            .adverbial,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.clause.adverbial =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                      {
                        label: "修飾語句",
                        labelPlacement:
                          resolvedSentenceStructureDiagramNotation
                            .sentenceStructureElementNotation
                            .sentenceConstituentLabeling.placement
                            .modifierPhrase,
                        onChange: (newLabelPlacement) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.placement.modifierPhrase =
                            newLabelPlacement;
                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        },
                      },
                    ] satisfies {
                      label: string;
                      labelPlacement: (typeof labelPlacementOptions)[number];
                      onChange: (
                        newLabelPlacement: (typeof labelPlacementOptions)[number],
                      ) => void;
                    }[]
                  ).map(({ label, labelPlacement, onChange }) => (
                    <FormControl key={label}>
                      <InputLabel>{label}</InputLabel>
                      <Select
                        label={label}
                        value={labelPlacement}
                        onChange={(e) =>
                          onChange(
                            e.target
                              .value as (typeof labelPlacementOptions)[number],
                          )
                        }
                        sx={{ minWidth: 120 }}
                      >
                        {labelPlacementOptions.map((labelPlacementOption) => (
                          <MenuItem
                            key={labelPlacementOption}
                            value={labelPlacementOption}
                          >
                            {(() => {
                              switch (labelPlacementOption) {
                                case "below-center":
                                  return "中央下";
                                case "below-left":
                                  return "左下";
                                case "above-center":
                                  return "中央上";
                                case "above-left":
                                  return "左上";
                                default:
                                  labelPlacementOption satisfies never;
                                  throw new Error("Unreachable");
                              }
                            })()}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  文の構成要素ラベルの色
                </Typography>
                <FormControl>
                  <InputLabel>色</InputLabel>
                  <Select
                    label="色"
                    value={
                      resolvedSentenceStructureDiagramNotation
                        .sentenceStructureElementNotation
                        .sentenceConstituentLabeling.color
                    }
                    onChange={(e) => {
                      const newSentenceStructureDiagramNotation = {
                        ...resolvedSentenceStructureDiagramNotation,
                      };
                      newSentenceStructureDiagramNotation.sentenceStructureElementNotation.sentenceConstituentLabeling.color =
                        e.target.value as (typeof colorOptions)[number];
                      setSentenceStructureDiagramDisplaySettings({
                        presetName: null,
                        sentenceStructureDiagramNotation:
                          newSentenceStructureDiagramNotation,
                      });
                    }}
                    sx={{ minWidth: 120 }}
                  >
                    {colorOptions.map((colorOption) => (
                      <MenuItem key={colorOption} value={colorOption}>
                        {(() => {
                          switch (colorOption) {
                            case "primary":
                              return "強調色";
                            case "text":
                              return "文字色";
                            case "background":
                              return "背景色";
                            default:
                              colorOption satisfies never;
                              throw new Error("Unreachable");
                          }
                        })()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  修飾関係の矢印
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  <FormControl>
                    <InputLabel>形状</InputLabel>
                    <Select
                      label="形状"
                      value={
                        resolvedSentenceStructureDiagramNotation
                          .modificationNotation.arrow.type
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.modificationNotation.arrow.type =
                          e.target.value as "curved" | "orthogonal";
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="curved">曲線</MenuItem>
                      <MenuItem value="orthogonal">直角</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl>
                    <InputLabel>色</InputLabel>
                    <Select
                      label="色"
                      value={
                        resolvedSentenceStructureDiagramNotation
                          .modificationNotation.arrow.color
                      }
                      onChange={(e) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.modificationNotation.arrow.color =
                          e.target.value as (typeof colorOptions)[number];
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      }}
                      sx={{ minWidth: 120 }}
                    >
                      {colorOptions.map((colorOption) => (
                        <MenuItem key={colorOption} value={colorOption}>
                          {(() => {
                            switch (colorOption) {
                              case "primary":
                                return "強調色";
                              case "text":
                                return "文字色";
                              case "background":
                                return "背景色";
                              default:
                                colorOption satisfies never;
                                throw new Error("Unreachable");
                            }
                          })()}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  並列関係の構成要素の範囲表示
                </Typography>
                {(
                  [
                    {
                      label: "等位接続詞",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .coordinationNotation.rangeMarking.coordinator,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.coordinationNotation.rangeMarking.coordinator =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "相関接続詞",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .coordinationNotation.rangeMarking.correlative,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.coordinationNotation.rangeMarking.correlative =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                    {
                      label: "並列要素",
                      rangeMarker:
                        resolvedSentenceStructureDiagramNotation
                          .coordinationNotation.rangeMarking.conjunct,
                      onChange: (newRangeMarker: RangeMarker) => {
                        const newSentenceStructureDiagramNotation = {
                          ...resolvedSentenceStructureDiagramNotation,
                        };
                        newSentenceStructureDiagramNotation.coordinationNotation.rangeMarking.conjunct =
                          newRangeMarker;
                        setSentenceStructureDiagramDisplaySettings({
                          presetName: null,
                          sentenceStructureDiagramNotation:
                            newSentenceStructureDiagramNotation,
                        });
                      },
                    },
                  ] satisfies {
                    label: string;
                    rangeMarker: RangeMarker;
                    onChange: (newRangeMarker: RangeMarker) => void;
                  }[]
                ).map(({ label, rangeMarker, onChange }) => (
                  <Stack key={label} gap={1}>
                    <Typography variant="subtitle1" component="div">
                      {label}
                    </Typography>
                    <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                      <FormControl>
                        <InputLabel>種類</InputLabel>
                        <Select
                          label="種類"
                          value={rangeMarker.type}
                          onChange={(e) => {
                            const rangeMarkerType = e.target
                              .value as RangeMarker["type"];

                            switch (rangeMarkerType) {
                              case "underline": {
                                onChange({
                                  type: "underline",
                                  lineStyle:
                                    rangeMarker.type === "underline"
                                      ? rangeMarker.lineStyle
                                      : "solid",
                                  color:
                                    rangeMarker.type === "underline"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "bracket": {
                                onChange({
                                  type: "bracket",
                                  bracketType:
                                    rangeMarker.type === "bracket"
                                      ? rangeMarker.bracketType
                                      : "parenthesis",
                                  color:
                                    rangeMarker.type === "bracket"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "box":
                              case "text-emphasis": {
                                onChange({
                                  type: rangeMarkerType,
                                  color:
                                    rangeMarker.type === "box" ||
                                    rangeMarker.type === "text-emphasis"
                                      ? rangeMarker.color
                                      : "primary",
                                });
                                break;
                              }
                              case "highlight": {
                                onChange({
                                  type: rangeMarkerType,
                                  color:
                                    rangeMarker.type === "highlight"
                                      ? rangeMarker.color
                                      : "background",
                                });
                                break;
                              }
                              case "bold":
                              case "none": {
                                onChange({
                                  type: rangeMarkerType,
                                });
                                break;
                              }
                              default: {
                                rangeMarkerType satisfies never;
                                throw new Error("Unreachable");
                              }
                            }
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="underline">下線</MenuItem>
                          <MenuItem value="bracket">括弧</MenuItem>
                          <MenuItem value="box">囲み</MenuItem>
                          <MenuItem value="text-emphasis">文字強調</MenuItem>
                          <MenuItem value="highlight">ハイライト</MenuItem>
                          <MenuItem value="bold">太字</MenuItem>
                          <MenuItem value="none">なし</MenuItem>
                        </Select>
                      </FormControl>

                      {(() => {
                        switch (rangeMarker.type) {
                          case "underline": {
                            return (
                              <>
                                <FormControl>
                                  <InputLabel>線種</InputLabel>
                                  <Select
                                    label="線種"
                                    value={rangeMarker.lineStyle}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        lineStyle: e.target
                                          .value as (typeof lineStyleOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {lineStyleOptions.map((lineStyleOption) => (
                                      <MenuItem
                                        key={lineStyleOption}
                                        value={lineStyleOption}
                                      >
                                        {(() => {
                                          switch (lineStyleOption) {
                                            case "solid":
                                              return "実線";
                                            case "dashed":
                                              return "破線";
                                            default:
                                              lineStyleOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <FormControl>
                                  <InputLabel>色</InputLabel>
                                  <Select
                                    label="色"
                                    value={rangeMarker.color}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        color: e.target
                                          .value as (typeof colorOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {colorOptions.map((colorOption) => (
                                      <MenuItem
                                        key={colorOption}
                                        value={colorOption}
                                      >
                                        {(() => {
                                          switch (colorOption) {
                                            case "primary":
                                              return "強調色";
                                            case "text":
                                              return "文字色";
                                            case "background":
                                              return "背景色";
                                            default:
                                              colorOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            );
                          }
                          case "bracket": {
                            return (
                              <>
                                <FormControl>
                                  <InputLabel>括弧</InputLabel>
                                  <Select
                                    label="括弧"
                                    value={rangeMarker.bracketType}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        bracketType: e.target
                                          .value as (typeof bracketTypeOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {bracketTypeOptions.map(
                                      (bracketTypeOption) => (
                                        <MenuItem
                                          key={bracketTypeOption}
                                          value={bracketTypeOption}
                                        >
                                          {(() => {
                                            switch (bracketTypeOption) {
                                              case "parenthesis":
                                                return "小括弧";
                                              case "angle-bracket":
                                                return "山括弧";
                                              case "curly-bracket":
                                                return "中括弧";
                                              case "square-bracket":
                                                return "大括弧";
                                              default:
                                                bracketTypeOption satisfies never;
                                                throw new Error("Unreachable");
                                            }
                                          })()}
                                        </MenuItem>
                                      ),
                                    )}
                                  </Select>
                                </FormControl>
                                <FormControl>
                                  <InputLabel>色</InputLabel>
                                  <Select
                                    label="色"
                                    value={rangeMarker.color}
                                    onChange={(e) =>
                                      onChange({
                                        ...rangeMarker,
                                        color: e.target
                                          .value as (typeof colorOptions)[number],
                                      })
                                    }
                                    sx={{ minWidth: 120 }}
                                  >
                                    {colorOptions.map((colorOption) => (
                                      <MenuItem
                                        key={colorOption}
                                        value={colorOption}
                                      >
                                        {(() => {
                                          switch (colorOption) {
                                            case "primary":
                                              return "強調色";
                                            case "text":
                                              return "文字色";
                                            case "background":
                                              return "背景色";
                                            default:
                                              colorOption satisfies never;
                                              throw new Error("Unreachable");
                                          }
                                        })()}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </>
                            );
                          }
                          case "box":
                          case "text-emphasis":
                          case "highlight": {
                            return (
                              <FormControl>
                                <InputLabel>色</InputLabel>
                                <Select
                                  label="色"
                                  value={rangeMarker.color}
                                  onChange={(e) =>
                                    onChange({
                                      ...rangeMarker,
                                      color: e.target
                                        .value as (typeof colorOptions)[number],
                                    })
                                  }
                                  sx={{ minWidth: 120 }}
                                >
                                  {colorOptions.map((colorOption) => (
                                    <MenuItem
                                      key={colorOption}
                                      value={colorOption}
                                    >
                                      {(() => {
                                        switch (colorOption) {
                                          case "primary":
                                            return "強調色";
                                          case "text":
                                            return "文字色";
                                          case "background":
                                            return "背景色";
                                          default:
                                            colorOption satisfies never;
                                            throw new Error("Unreachable");
                                        }
                                      })()}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            );
                          }
                        }
                      })()}
                    </Stack>
                  </Stack>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack gap={2}>
                <Typography variant="h6" component="div">
                  並列関係の範囲表示
                </Typography>
                <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                  {!resolvedSentenceStructureDiagramNotation.enableReflow ? (
                    <FormControl>
                      <InputLabel>種類</InputLabel>
                      <Select
                        label="種類"
                        value={
                          resolvedSentenceStructureDiagramNotation
                            .coordinationNotation.groupIndicator.type
                        }
                        onChange={(e) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          const groupIndicatorType = e.target.value as
                            | "bus-connector"
                            | "none";

                          switch (groupIndicatorType) {
                            case "bus-connector":
                              newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                {
                                  type: "bus-connector",
                                  color:
                                    resolvedSentenceStructureDiagramNotation
                                      .coordinationNotation.groupIndicator
                                      .type === "bus-connector"
                                      ? resolvedSentenceStructureDiagramNotation
                                          .coordinationNotation.groupIndicator
                                          .color
                                      : "primary",
                                };
                              break;
                            case "none":
                              newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                {
                                  type: "none",
                                };
                              break;
                            default:
                              groupIndicatorType satisfies never;
                              throw new Error("Unreachable");
                          }

                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="bus-connector">接続線</MenuItem>
                        <MenuItem value="none">なし</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <FormControl>
                      <InputLabel>種類</InputLabel>
                      <Select
                        label="種類"
                        value={
                          resolvedSentenceStructureDiagramNotation
                            .coordinationNotation.groupIndicator.type
                        }
                        onChange={(e) => {
                          const newSentenceStructureDiagramNotation = {
                            ...resolvedSentenceStructureDiagramNotation,
                          };
                          const groupIndicatorType = e.target.value as
                            | "bracket"
                            | "bus-connector"
                            | "none";

                          switch (groupIndicatorType) {
                            case "bracket": {
                              newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                {
                                  type: "bracket",
                                  bracketType:
                                    resolvedSentenceStructureDiagramNotation
                                      .coordinationNotation.groupIndicator
                                      .type === "bracket"
                                      ? resolvedSentenceStructureDiagramNotation
                                          .coordinationNotation.groupIndicator
                                          .bracketType
                                      : "square-bracket",
                                  placement:
                                    resolvedSentenceStructureDiagramNotation
                                      .coordinationNotation.groupIndicator
                                      .type === "bracket"
                                      ? resolvedSentenceStructureDiagramNotation
                                          .coordinationNotation.groupIndicator
                                          .placement
                                      : "left",
                                  color:
                                    resolvedSentenceStructureDiagramNotation
                                      .coordinationNotation.groupIndicator
                                      .type === "bracket"
                                      ? resolvedSentenceStructureDiagramNotation
                                          .coordinationNotation.groupIndicator
                                          .color
                                      : "primary",
                                };
                              break;
                            }
                            case "bus-connector": {
                              newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                {
                                  type: "bus-connector",
                                  color:
                                    resolvedSentenceStructureDiagramNotation
                                      .coordinationNotation.groupIndicator
                                      .type === "bus-connector"
                                      ? resolvedSentenceStructureDiagramNotation
                                          .coordinationNotation.groupIndicator
                                          .color
                                      : "primary",
                                };
                              break;
                            }
                            case "none": {
                              newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                {
                                  type: "none",
                                };
                              break;
                            }
                            default: {
                              groupIndicatorType satisfies never;
                              throw new Error("Unreachable");
                            }
                          }

                          setSentenceStructureDiagramDisplaySettings({
                            presetName: null,
                            sentenceStructureDiagramNotation:
                              newSentenceStructureDiagramNotation,
                          });
                        }}
                        sx={{ minWidth: 120 }}
                      >
                        <MenuItem value="bracket">括弧</MenuItem>
                        <MenuItem value="bus-connector">接続線</MenuItem>
                        <MenuItem value="none">なし</MenuItem>
                      </Select>
                    </FormControl>
                  )}

                  {(() => {
                    const groupIndicator =
                      resolvedSentenceStructureDiagramNotation
                        .coordinationNotation.groupIndicator;
                    switch (groupIndicator.type) {
                      case "bracket": {
                        return (
                          <>
                            <FormControl>
                              <InputLabel>括弧</InputLabel>
                              <Select
                                label="括弧"
                                value={groupIndicator.bracketType}
                                onChange={(e) => {
                                  const newSentenceStructureDiagramNotation = {
                                    ...resolvedSentenceStructureDiagramNotation,
                                  };
                                  newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                    {
                                      type: groupIndicator.type,
                                      bracketType: e.target
                                        .value as (typeof bracketTypeOptions)[number],
                                      placement: groupIndicator.placement,
                                      color: groupIndicator.color,
                                    };

                                  setSentenceStructureDiagramDisplaySettings({
                                    presetName: null,
                                    sentenceStructureDiagramNotation:
                                      newSentenceStructureDiagramNotation,
                                  });
                                }}
                                sx={{ minWidth: 120 }}
                              >
                                {bracketTypeOptions.map((bracketTypeOption) => (
                                  <MenuItem
                                    key={bracketTypeOption}
                                    value={bracketTypeOption}
                                  >
                                    {(() => {
                                      switch (bracketTypeOption) {
                                        case "parenthesis":
                                          return "小括弧";
                                        case "angle-bracket":
                                          return "山括弧";
                                        case "curly-bracket":
                                          return "中括弧";
                                        case "square-bracket":
                                          return "大括弧";
                                        default:
                                          bracketTypeOption satisfies never;
                                          throw new Error("Unreachable");
                                      }
                                    })()}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            <FormControl>
                              <InputLabel>位置</InputLabel>
                              <Select
                                label="位置"
                                value={groupIndicator.placement}
                                onChange={(e) => {
                                  const newSentenceStructureDiagramNotation = {
                                    ...resolvedSentenceStructureDiagramNotation,
                                  };
                                  newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                    {
                                      type: groupIndicator.type,
                                      bracketType: groupIndicator.bracketType,
                                      placement: e.target.value as
                                        | "left"
                                        | "both-sides",
                                      color: groupIndicator.color,
                                    };

                                  setSentenceStructureDiagramDisplaySettings({
                                    presetName: null,
                                    sentenceStructureDiagramNotation:
                                      newSentenceStructureDiagramNotation,
                                  });
                                }}
                                sx={{ minWidth: 120 }}
                              >
                                <MenuItem value="left">左側</MenuItem>
                                <MenuItem value="both-sides">両側</MenuItem>
                              </Select>
                            </FormControl>
                            <FormControl>
                              <InputLabel>色</InputLabel>
                              <Select
                                label="色"
                                value={groupIndicator.color}
                                onChange={(e) => {
                                  const newSentenceStructureDiagramNotation = {
                                    ...resolvedSentenceStructureDiagramNotation,
                                  };
                                  newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                    {
                                      type: groupIndicator.type,
                                      bracketType: groupIndicator.bracketType,
                                      placement: groupIndicator.placement,
                                      color: e.target
                                        .value as (typeof colorOptions)[number],
                                    };

                                  setSentenceStructureDiagramDisplaySettings({
                                    presetName: null,
                                    sentenceStructureDiagramNotation:
                                      newSentenceStructureDiagramNotation,
                                  });
                                }}
                                sx={{ minWidth: 120 }}
                              >
                                {colorOptions.map((colorOption) => (
                                  <MenuItem
                                    key={colorOption}
                                    value={colorOption}
                                  >
                                    {(() => {
                                      switch (colorOption) {
                                        case "primary":
                                          return "強調色";
                                        case "text":
                                          return "文字色";
                                        case "background":
                                          return "背景色";
                                        default:
                                          colorOption satisfies never;
                                          throw new Error("Unreachable");
                                      }
                                    })()}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </>
                        );
                      }
                      case "bus-connector": {
                        return (
                          <FormControl>
                            <InputLabel>色</InputLabel>
                            <Select
                              label="色"
                              value={groupIndicator.color}
                              onChange={(e) => {
                                const newSentenceStructureDiagramNotation = {
                                  ...resolvedSentenceStructureDiagramNotation,
                                };
                                newSentenceStructureDiagramNotation.coordinationNotation.groupIndicator =
                                  {
                                    type: groupIndicator.type,
                                    color: e.target
                                      .value as (typeof colorOptions)[number],
                                  };

                                setSentenceStructureDiagramDisplaySettings({
                                  presetName: null,
                                  sentenceStructureDiagramNotation:
                                    newSentenceStructureDiagramNotation,
                                });
                              }}
                              sx={{ minWidth: 120 }}
                            >
                              {colorOptions.map((colorOption) => (
                                <MenuItem key={colorOption} value={colorOption}>
                                  {(() => {
                                    switch (colorOption) {
                                      case "primary":
                                        return "強調色";
                                      case "text":
                                        return "文字色";
                                      case "background":
                                        return "背景色";
                                      default:
                                        colorOption satisfies never;
                                        throw new Error("Unreachable");
                                    }
                                  })()}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        );
                      }
                      case "none": {
                        return;
                      }
                      default: {
                        groupIndicator satisfies never;
                        throw new Error("Unreachable");
                      }
                    }
                  })()}
                </Stack>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {resolvedSentenceStructureDiagramNotation.enableReflow && (
                <>
                  <Stack gap={2}>
                    <Typography variant="h6" component="div">
                      折り返し方針
                    </Typography>
                    <Stack direction="row" gap={1} sx={{ flexWrap: "wrap" }}>
                      <FormControl>
                        <InputLabel>折り返し方法</InputLabel>
                        <Select
                          label="折り返し方法"
                          value={
                            resolvedSentenceStructureDiagramNotation
                              .layoutStrategy.lineBreakStrategy
                          }
                          onChange={(e) => {
                            const newSentenceStructureDiagramNotation = {
                              ...resolvedSentenceStructureDiagramNotation,
                            };
                            const lineBreakStrategy = e.target.value as
                              | "greedy-word-wrap"
                              | "largest-boundary-first";

                            switch (lineBreakStrategy) {
                              case "greedy-word-wrap":
                                newSentenceStructureDiagramNotation.layoutStrategy =
                                  {
                                    lineBreakStrategy: "greedy-word-wrap",
                                  };
                                break;
                              case "largest-boundary-first":
                                newSentenceStructureDiagramNotation.layoutStrategy =
                                  {
                                    lineBreakStrategy: "largest-boundary-first",
                                    continuationLineStart:
                                      resolvedSentenceStructureDiagramNotation
                                        .layoutStrategy.lineBreakStrategy ===
                                      "largest-boundary-first"
                                        ? resolvedSentenceStructureDiagramNotation
                                            .layoutStrategy
                                            .continuationLineStart
                                        : "scope-start",
                                  };
                                break;
                              default:
                                lineBreakStrategy satisfies never;
                                throw new Error("Unreachable");
                            }

                            setSentenceStructureDiagramDisplaySettings({
                              presetName: null,
                              sentenceStructureDiagramNotation:
                                newSentenceStructureDiagramNotation,
                            });
                          }}
                          sx={{ minWidth: 120 }}
                        >
                          <MenuItem value="greedy-word-wrap">
                            単語単位で折り返す
                          </MenuItem>
                          <MenuItem value="largest-boundary-first">
                            まとまりを優先して折り返す
                          </MenuItem>
                        </Select>
                      </FormControl>
                      {(() => {
                        switch (
                          resolvedSentenceStructureDiagramNotation
                            .layoutStrategy.lineBreakStrategy
                        ) {
                          case "largest-boundary-first": {
                            return (
                              <FormControl>
                                <InputLabel>折り返し後の開始位置</InputLabel>
                                <Select
                                  label="折り返し後の開始位置"
                                  value={
                                    resolvedSentenceStructureDiagramNotation
                                      .layoutStrategy.continuationLineStart
                                  }
                                  onChange={(e) => {
                                    const newSentenceStructureDiagramNotation =
                                      {
                                        ...resolvedSentenceStructureDiagramNotation,
                                      };
                                    newSentenceStructureDiagramNotation.layoutStrategy =
                                      {
                                        lineBreakStrategy:
                                          resolvedSentenceStructureDiagramNotation
                                            .layoutStrategy.lineBreakStrategy,
                                        continuationLineStart: e.target
                                          .value as
                                          | "content-start"
                                          | "scope-start",
                                      };

                                    setSentenceStructureDiagramDisplaySettings({
                                      presetName: null,
                                      sentenceStructureDiagramNotation:
                                        newSentenceStructureDiagramNotation,
                                    });
                                  }}
                                  sx={{ minWidth: 120 }}
                                >
                                  <MenuItem value="content-start">
                                    左端から始める
                                  </MenuItem>
                                  <MenuItem value="scope-start">
                                    字下げして始める
                                  </MenuItem>
                                </Select>
                              </FormControl>
                            );
                          }
                        }
                      })()}
                    </Stack>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                </>
              )}
            </>
          )}
        </Box>
      </Stack>
    </Dialog>
  );
}
