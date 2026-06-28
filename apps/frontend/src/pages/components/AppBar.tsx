import { useRef, useState } from "react";
import {
  AppBar as MUIAppBar,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { createSentenceStructureDocumentFromXMLString } from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";
import ExportDialog from "./ExportDialog";

export default function AppBar() {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { setSentenceStructureDocument } = useSentenceStructureDocument();

  return (
    <MUIAppBar position="static" color="default">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          SV-Marker
        </Typography>
        <IconButton onClick={(e) => setAnchorElement(e.currentTarget)}>
          <MenuIcon />
        </IconButton>
        <Menu
          anchorEl={anchorElement}
          open={!!anchorElement}
          onClose={() => setAnchorElement(null)}
        >
          <MenuItem
            onClick={() => {
              setAnchorElement(null);
              setIsExportDialogOpen(true);
            }}
          >
            <ListItemIcon>
              <FileDownloadIcon />
            </ListItemIcon>
            エクスポート
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorElement(null);
              fileInputRef.current?.click();
            }}
          >
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            インポート
          </MenuItem>
        </Menu>
        <ExportDialog
          isOpen={isExportDialogOpen}
          onClose={() => setIsExportDialogOpen(false)}
        />
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
      </Toolbar>
    </MUIAppBar>
  );
}
