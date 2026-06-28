import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { clearSentenceStructureAnnotations } from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";

type ConfirmClearSentenceStructureAnnotationsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ConfirmClearSentenceStructureAnnotationsDialog({
  isOpen,
  onClose,
}: ConfirmClearSentenceStructureAnnotationsDialogProps) {
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>本当に注釈データをすべてクリアしますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>
          注釈データがすべて失われます。この操作は元に戻せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={() => {
            setSentenceStructureDocument(
              clearSentenceStructureAnnotations(sentenceStructureDocument),
            );
            onClose();
          }}
        >
          すべてクリア
        </Button>
      </DialogActions>
    </Dialog>
  );
}
