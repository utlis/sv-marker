import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  AutoAwesome as AutoAwesomeIcon,
  ClearAll as ClearAllIcon,
  ExpandMore as ExpandMoreIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
} from "@mui/icons-material";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  createSentenceStructureDocumentFromXMLString,
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";
import ConfirmClearSentenceStructureAnnotationsDialog from "./ConfirmClearSentenceStructureAnnotationsDialog";
import ConfirmGenerateSentenceStructureDocumentDialog from "./ConfirmGenerateSentenceStructureDocumentDialog";
import ExportDialog from "./ExportDialog";

export default function SentenceStructureDocumentControlPanel() {
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

  const [
    isConfirmGenerateSentenceStructureDocumentDialogOpen,
    setIsConfirmGenerateSentenceStructureDocumentDialogOpen,
  ] = useState(false);

  const { data: statusData } = useQuery(trpc.status.queryOptions());
  const reviseSimplifiedSentenceStructureDocumentMutation = useMutation(
    trpc.reviseSimplifiedSentenceStructureDocument.mutationOptions(),
  );
  const [userRevisionInstruction, _setUserRevisionInstruction] = useState(
    () => {
      const storedUserRevisionInstruction = localStorage.getItem(
        "user-revision-instruction",
      );
      return storedUserRevisionInstruction ?? "";
    },
  );
  function setUserRevisionInstruction(newUserRevisionInstruction: string) {
    localStorage.setItem(
      "user-revision-instruction",
      newUserRevisionInstruction,
    );
    _setUserRevisionInstruction(newUserRevisionInstruction);
  }

  const [
    isConfirmClearSentenceStructureAnnotationsDialogOpen,
    setIsConfirmClearSentenceStructureAnnotationsDialogOpen,
  ] = useState(false);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const drawerWidth = 360;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        [`& .MuiDrawer-paper`]: { width: drawerWidth },
      }}
    >
      <Toolbar />
      <Stack p={3} spacing={4}>
        <Stack spacing={1}>
          <Typography variant="body1" component="div">
            編集
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              disabled={statusData?.status !== "ok"}
              onClick={() =>
                setIsConfirmGenerateSentenceStructureDocumentDialogOpen(true)
              }
            >
              自動生成
            </Button>
            <ConfirmGenerateSentenceStructureDocumentDialog
              isOpen={isConfirmGenerateSentenceStructureDocumentDialogOpen}
              onClose={() =>
                setIsConfirmGenerateSentenceStructureDocumentDialogOpen(false)
              }
            />
            <Button
              variant="outlined"
              color="error"
              startIcon={<ClearAllIcon />}
              onClick={() =>
                setIsConfirmClearSentenceStructureAnnotationsDialogOpen(true)
              }
            >
              リセット
            </Button>
            <ConfirmClearSentenceStructureAnnotationsDialog
              isOpen={isConfirmClearSentenceStructureAnnotationsDialogOpen}
              onClose={() =>
                setIsConfirmClearSentenceStructureAnnotationsDialogOpen(false)
              }
            />
          </Box>
        </Stack>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span">AIで修正</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              <Typography variant="body2" component="div">
                現在の注釈をもとに、AIにどのように修正してほしいかを書いてください。
              </Typography>
              <TextField
                label="AIへの指示"
                placeholder="例：準動詞句や節の内部の注釈は省略してください。"
                multiline
                minRows={4}
                value={userRevisionInstruction}
                disabled={
                  statusData?.status !== "ok" ||
                  reviseSimplifiedSentenceStructureDocumentMutation.isPending
                }
                onChange={(e) => {
                  setUserRevisionInstruction(e.target.value);
                }}
              />
              <Button
                variant="contained"
                disabled={userRevisionInstruction.trim() === ""}
                loading={
                  reviseSimplifiedSentenceStructureDocumentMutation.isPending
                }
                loadingPosition="start"
                onClick={async () => {
                  const trimmedUserRevisionInstruction =
                    userRevisionInstruction.trim();
                  if (!trimmedUserRevisionInstruction) return;

                  try {
                    const newSimplifiedSentenceStructureDocument =
                      await reviseSimplifiedSentenceStructureDocumentMutation.mutateAsync(
                        {
                          userRevisionInstruction:
                            trimmedUserRevisionInstruction,
                          baseSimplifiedSentenceStructureDocument:
                            sentenceStructureDocumentToSimplifiedSentenceStructureDocument(
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
                    alert("修正に失敗しました。");
                  }
                }}
              >
                生成
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
        <Stack spacing={1}>
          <Typography variant="body1" component="div">
            データ
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              インポート
            </Button>
            <input
              ref={fileInputRef}
              hidden
              type="file"
              accept="image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  try {
                    if (typeof reader.result !== "string") {
                      throw new Error("Invalid file");
                    }
                    const svg = new DOMParser().parseFromString(
                      reader.result,
                      "image/svg+xml",
                    );
                    const sentenceStructureDocumentResult =
                      createSentenceStructureDocumentFromXMLString(
                        svg.querySelector("sentence-structure-document")
                          ?.outerHTML ?? "",
                      );
                    if (sentenceStructureDocumentResult.success) {
                      setSentenceStructureDocument(
                        sentenceStructureDocumentResult.data
                          .newSentenceStructureDocument,
                      );
                    } else {
                      alert(sentenceStructureDocumentResult.message);
                      return;
                    }
                  } catch {
                    alert(
                      "ファイルの読み込みに失敗しました。正しい形式のファイルを選択してください。",
                    );
                  }
                };
                reader.readAsText(file);
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => setIsExportDialogOpen(true)}
            >
              エクスポート
            </Button>
            <ExportDialog
              isOpen={isExportDialogOpen}
              onClose={() => setIsExportDialogOpen(false)}
            />
          </Box>
        </Stack>
      </Stack>
    </Drawer>
  );
}
