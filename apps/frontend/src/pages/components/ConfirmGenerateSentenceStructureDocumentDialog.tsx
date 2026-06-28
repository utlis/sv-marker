import { useMutation } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToText,
} from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";

type ConfirmGenerateSentenceStructureDocumentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ConfirmGenerateSentenceStructureDocumentDialog({
  isOpen,
  onClose,
}: ConfirmGenerateSentenceStructureDocumentDialogProps) {
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

  const generateSimplifiedSentenceStructureDocumentMutation = useMutation(
    trpc.generateSimplifiedSentenceStructureDocument.mutationOptions(),
  );

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogTitle>本当に自動生成しますか？</DialogTitle>
      <DialogContent>
        <DialogContentText>
          既存の注釈データは自動生成した内容で上書きされます。この操作は元に戻せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          loading={
            generateSimplifiedSentenceStructureDocumentMutation.isPending
          }
          loadingPosition="start"
          onClick={async () => {
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
              onClose();
            } catch {
              alert("自動生成に失敗しました。");
            }
          }}
        >
          自動生成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
