import { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
  IconButton,
  Input,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { sentenceStructureDataToString } from "@sentence-structure-diagram-app/sentence-structure-data";
import { generateSvgString } from "@sentence-structure-diagram-app/sentence-structure-diagram-svg";
import { useSentenceStructureData } from "../contexts/SentenceStructureDataProvider";
import { useConfigurations } from "../contexts/ConfigurationsProvider";
import { measureTextWidth } from "../utils/measure-text-width";

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExportDialog({ isOpen, onClose }: ExportDialogProps) {
  const [imageWidth, setImageWidth] = useState(1000);

  const { sentenceStructureData } = useSentenceStructureData();
  const { configurations, setConfigurations } = useConfigurations();

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
              onClick={async () => {
                // const fileType: string = "SVG";
                // if (fileType === "JSON")
                // eslint-disable-next-line no-constant-condition
                if (false) {
                  const blob = new Blob(
                    [sentenceStructureDataToString(sentenceStructureData)],
                    {
                      type: "application/json",
                    },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "sentence-structure-diagram.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }
                // else
                {
                  // const svgString = (() => {
                  //   const svgDocument = new DOMParser().parseFromString(
                  //     ReactDOMServer.renderToStaticMarkup(
                  //       SentenceStructureDiagram({
                  //         sentenceStructureDiagramData:
                  //           convertSentenceStructureDataToSentenceStructureDiagramData(
                  //             sentenceStructureData,
                  //             imageWidth,
                  //             measureTextWidth,
                  //             configurations,
                  //           ),
                  //       }),
                  //     ),
                  //     "image/svg+xml",
                  //   );
                  //   const metadataElement = svgDocument.createElementNS(
                  //     "http://www.w3.org/2000/svg",
                  //     "metadata",
                  //   );
                  //   const sentenceStructureDataElement =
                  //     svgDocument.createElementNS(
                  //       "https://chvmvd.github.io/sentence-structure-diagram-app/",
                  //       "sentence-structure-data",
                  //     );
                  //   sentenceStructureDataElement.setAttribute(
                  //     "version",
                  //     "0.1.0",
                  //   );
                  //   sentenceStructureDataElement.innerHTML =
                  //     sentenceStructureDataToXMLString(sentenceStructureData);
                  //   metadataElement.appendChild(sentenceStructureDataElement);
                  //   const configurationsElement = svgDocument.createElementNS(
                  //     "https://chvmvd.github.io/sentence-structure-diagram-app/",
                  //     "configurations",
                  //   );
                  //   configurationsElement.setAttribute("version", "0.1.0");
                  //   configurationsElement.innerHTML =
                  //     getConfigurationsXMLString();
                  //   metadataElement.appendChild(configurationsElement);
                  //   svgDocument
                  //     .querySelector("svg")
                  //     ?.appendChild(metadataElement);

                  //   // const versionMetadataElement = svgDocument.createElementNS(
                  //   //   "http://www.w3.org/2000/svg",
                  //   //   "metadata",
                  //   // );
                  //   // versionMetadataElement.id = "version";
                  //   // versionMetadataElement.textContent = "0.1.0";
                  //   // svgDocument
                  //   //   .querySelector("svg")
                  //   //   ?.appendChild(versionMetadataElement);
                  //   // const sentenceStructureDataMetadataElement =
                  //   //   svgDocument.createElementNS(
                  //   //     "http://www.w3.org/2000/svg",
                  //   //     "metadata",
                  //   //   );
                  //   // sentenceStructureDataMetadataElement.id =
                  //   //   "sentence-structure-data";
                  //   // const sentenceStructureDataCdata =
                  //   //   svgDocument.createCDATASection(
                  //   //     "\n" +
                  //   //       stringToSimplifiedSentenceStructureData.encode(
                  //   //         simplifiedSentenceStructureDataToSentenceStructureData.encode(
                  //   //           sentenceStructureData,
                  //   //         ),
                  //   //       ) +
                  //   //       "\n",
                  //   //   );
                  //   // sentenceStructureDataMetadataElement.appendChild(
                  //   //   sentenceStructureDataCdata,
                  //   // );
                  //   // svgDocument
                  //   //   .querySelector("svg")
                  //   //   ?.appendChild(sentenceStructureDataMetadataElement);
                  //   // const configurationsMetadataElement =
                  //   //   svgDocument.createElementNS(
                  //   //     "http://www.w3.org/2000/svg",
                  //   //     "metadata",
                  //   //   );
                  //   // configurationsMetadataElement.id = "configurations";
                  //   // const configurationsCdata = svgDocument.createCDATASection(
                  //   //   "\n" + stringToConfigurations.encode(configurations) + "\n",
                  //   // );
                  //   // configurationsMetadataElement.appendChild(
                  //   //   configurationsCdata,
                  //   // );
                  //   // svgDocument
                  //   //   .querySelector("svg")
                  //   //   ?.appendChild(configurationsMetadataElement);
                  //   return new XMLSerializer().serializeToString(svgDocument);
                  // })();
                  const blob = new Blob(
                    [
                      generateSvgString(
                        sentenceStructureData,
                        imageWidth,
                        measureTextWidth,
                        configurations,
                      ),
                    ],
                    {
                      type: "image/svg+xml",
                    },
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "sentence-structure-diagram.svg";
                  a.click();
                  URL.revokeObjectURL(url);
                }
                onClose();
              }}
            >
              エクスポート
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Stack flexDirection="row" sx={{ overflow: "hidden" }}>
        <Stack sx={{ m: 4, flex: 2 }}>
          <Paper variant="outlined" sx={{ overflow: "auto" }}>
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(
                generateSvgString(
                  sentenceStructureData,
                  imageWidth,
                  measureTextWidth,
                  configurations,
                ),
              )}`}
            />
          </Paper>
        </Stack>
        <Box sx={{ m: 4, p: 2, flex: 1, overflow: "auto" }}>
          <Stack gap={2}>
            <Typography variant="subtitle1" component="div">
              画像の幅
            </Typography>
            <Stack direction="row" gap={1}>
              <Slider
                value={imageWidth}
                onChange={(_, newValue) => setImageWidth(newValue)}
                min={500}
                max={1500}
                valueLabelDisplay="auto"
              />
              <Input
                size="small"
                value={imageWidth}
                onChange={(e) => setImageWidth(Number(e.target.value))}
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
            <Typography variant="subtitle1" component="div">
              色
            </Typography>
            <Stack direction="row" gap={1}>
              <TextField
                type="color"
                variant="outlined"
                label="プライマリーカラー"
                value={configurations.color.primaryColor}
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    color: {
                      ...configurations.color,
                      primaryColor: e.target.value,
                    },
                  })
                }
                sx={{ minWidth: 140 }}
              />
              <TextField
                type="color"
                variant="outlined"
                label="テキストカラー"
                value={configurations.color.textColor}
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    color: {
                      ...configurations.color,
                      textColor: e.target.value,
                    },
                  })
                }
                sx={{ minWidth: 140 }}
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={2}>
            <Typography variant="subtitle1" component="div">
              文の構成単位の範囲
            </Typography>
            <Stack direction="row" gap={1}>
              <FormControl>
                <InputLabel>修飾語</InputLabel>
                <Select
                  value={
                    configurations.sentenceStructureRangeTypeToBracketNameMap
                      .modifier
                  }
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      sentenceStructureRangeTypeToBracketNameMap: {
                        ...configurations.sentenceStructureRangeTypeToBracketNameMap,
                        modifier: e.target.value,
                      },
                    })
                  }
                  label="修飾語"
                >
                  <MenuItem value="(parenthesis)">{"(小括弧)"}</MenuItem>
                  <MenuItem value="<angle-bracket>">{"<山括弧>"}</MenuItem>
                  <MenuItem value="{curly-bracket}">{"{中括弧}"}</MenuItem>
                  <MenuItem value="[square-bracket]">{"[大括弧]"}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>句</InputLabel>
                <Select
                  value={
                    configurations.sentenceStructureRangeTypeToBracketNameMap
                      .phrase
                  }
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      sentenceStructureRangeTypeToBracketNameMap: {
                        ...configurations.sentenceStructureRangeTypeToBracketNameMap,
                        phrase: e.target.value,
                      },
                    })
                  }
                  label="句"
                >
                  <MenuItem value="(parenthesis)">{"(小括弧)"}</MenuItem>
                  <MenuItem value="<angle-bracket>">{"<山括弧>"}</MenuItem>
                  <MenuItem value="{curly-bracket}">{"{中括弧}"}</MenuItem>
                  <MenuItem value="[square-bracket]">{"[大括弧]"}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>節</InputLabel>
                <Select
                  value={
                    configurations.sentenceStructureRangeTypeToBracketNameMap
                      .clause
                  }
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      sentenceStructureRangeTypeToBracketNameMap: {
                        ...configurations.sentenceStructureRangeTypeToBracketNameMap,
                        clause: e.target.value,
                      },
                    })
                  }
                  label="節"
                >
                  <MenuItem value="(parenthesis)">{"(小括弧)"}</MenuItem>
                  <MenuItem value="<angle-bracket>">{"<山括弧>"}</MenuItem>
                  <MenuItem value="{curly-bracket}">{"{中括弧}"}</MenuItem>
                  <MenuItem value="[square-bracket]">{"[大括弧]"}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={2}>
            <Typography variant="subtitle1" component="div">
              文の要素
            </Typography>
            <Stack direction="row" gap={1}>
              <TextField
                variant="outlined"
                label="主語"
                value={
                  configurations.sentenceElementNameToSentenceElementSymbolMap.S
                }
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    sentenceElementNameToSentenceElementSymbolMap: {
                      ...configurations.sentenceElementNameToSentenceElementSymbolMap,
                      S: e.target.value,
                    },
                  })
                }
              />
              <TextField
                variant="outlined"
                label="動詞"
                value={
                  configurations.sentenceElementNameToSentenceElementSymbolMap.V
                }
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    sentenceElementNameToSentenceElementSymbolMap: {
                      ...configurations.sentenceElementNameToSentenceElementSymbolMap,
                      V: e.target.value,
                    },
                  })
                }
              />
              <TextField
                variant="outlined"
                label="補語"
                value={
                  configurations.sentenceElementNameToSentenceElementSymbolMap.C
                }
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    sentenceElementNameToSentenceElementSymbolMap: {
                      ...configurations.sentenceElementNameToSentenceElementSymbolMap,
                      C: e.target.value,
                    },
                  })
                }
              />
              <TextField
                variant="outlined"
                label="目的語"
                value={
                  configurations.sentenceElementNameToSentenceElementSymbolMap.O
                }
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    sentenceElementNameToSentenceElementSymbolMap: {
                      ...configurations.sentenceElementNameToSentenceElementSymbolMap,
                      O: e.target.value,
                    },
                  })
                }
              />
              <TextField
                variant="outlined"
                label="修飾語"
                value={
                  configurations.sentenceElementNameToSentenceElementSymbolMap.M
                }
                onChange={(e) =>
                  setConfigurations({
                    ...configurations,
                    sentenceElementNameToSentenceElementSymbolMap: {
                      ...configurations.sentenceElementNameToSentenceElementSymbolMap,
                      M: e.target.value,
                    },
                  })
                }
              />
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={2}>
            <Typography variant="subtitle1" component="div">
              矢印の形状
            </Typography>
            <Stack direction="row" gap={1}>
              <FormControl>
                <InputLabel>矢印の形状</InputLabel>
                <Select
                  value={configurations.relationShapeType}
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      relationShapeType: e.target.value,
                    })
                  }
                  label="矢印の形状"
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value="curved">{"曲線"}</MenuItem>
                  <MenuItem value="right-angle">{"直角"}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Stack gap={2}>
            <Typography variant="subtitle1" component="div">
              レイアウト方式
            </Typography>
            <Stack direction="row" gap={1}>
              <FormControl>
                <InputLabel>レイアウト方式</InputLabel>
                <Select
                  value={configurations.layoutMode}
                  onChange={(e) =>
                    setConfigurations({
                      ...configurations,
                      layoutMode: e.target.value,
                    })
                  }
                  label="レイアウト方式"
                >
                  <MenuItem value="linear">横並び表示</MenuItem>
                  <MenuItem value="structured">構造化表示</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Dialog>
  );
}
