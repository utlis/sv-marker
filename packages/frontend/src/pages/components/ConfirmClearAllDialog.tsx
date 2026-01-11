import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useSentenceStructureData } from "../contexts/SentenceStructureDataProvider";

type ConfirmClearAllDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ConfirmClearAllDialog({
  isOpen,
  onClose,
}: ConfirmClearAllDialogProps) {
  const { initialSentenceStructureData, setSentenceStructureData } =
    useSentenceStructureData();

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>本当に全てクリアしますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>
          全てクリアすると、入力した英文と注釈データがすべて失われます。この操作は元に戻せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={() => {
            setSentenceStructureData(initialSentenceStructureData);
            onClose();
          }}
        >
          全てクリア
        </Button>
      </DialogActions>
    </Dialog>
  );
}
