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
import {
  createSentenceStructureDataFromStringData,
  createSentenceStructureDataFromXMLData,
} from "@sentence-structure-diagram-app/sentence-structure-data";
import { xmlStringToConfigurations } from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";
import { useSentenceStructureData } from "../contexts/SentenceStructureDataProvider";
import { useConfigurations } from "../contexts/ConfigurationsProvider";
import ExportDialog from "./ExportDialog";

export default function AppBar() {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { setSentenceStructureData } = useSentenceStructureData();

  const { setConfigurations } = useConfigurations();

  return (
    <MUIAppBar position="static" color="default">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flex: 1 }}>
          英文構造図作図支援アプリ（ベータ版）
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
          accept="application/json, image/svg+xml"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              try {
                if (typeof reader.result !== "string")
                  throw new Error("Invalid file");
                if (file.name.endsWith(".json")) {
                  const result = createSentenceStructureDataFromStringData(
                    reader.result,
                  );
                  if (result.success) {
                    setSentenceStructureData(
                      result.data.newSentenceStructureData,
                    );
                  } else {
                    alert(result.message);
                  }
                } else {
                  const svg = new DOMParser().parseFromString(
                    reader.result,
                    "image/svg+xml",
                  );
                  const sentenceStructureDataResult =
                    createSentenceStructureDataFromXMLData(
                      svg.querySelector("sentence-structure-data")?.innerHTML ??
                        "",
                    );
                  if (sentenceStructureDataResult.success) {
                    setSentenceStructureData(
                      sentenceStructureDataResult.data.newSentenceStructureData,
                    );
                  } else {
                    alert(sentenceStructureDataResult.message);
                    return;
                  }
                  // const newSentenceStructure =
                  //   simplifiedSentenceStructureDataToSentenceStructureData.decode(
                  //     stringToSimplifiedSentenceStructureData.decode(
                  //       svg.getElementById("sentence-structure-data")
                  //         ?.textContent ?? "",
                  //     ),
                  //   );

                  setConfigurations(
                    xmlStringToConfigurations.decode(
                      svg.querySelector("configurations")?.innerHTML ?? "",
                    ),
                  );
                  // const newConfigurations = stringToConfigurations.decode(
                  //   svg.getElementById("configurations")?.textContent ?? "",
                  // );
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
