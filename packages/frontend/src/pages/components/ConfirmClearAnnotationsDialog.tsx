import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type ConfirmClearAnnotationsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmClearAnnotationsDialog({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmClearAnnotationsDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>本当にテキスト編集モードに切り替えますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>
          テキスト編集モードに切り替えると、現在の注釈データがすべて失われます。この操作は元に戻せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={onConfirm}>テキスト編集モードに切り替える</Button>
      </DialogActions>
    </Dialog>
  );
}
