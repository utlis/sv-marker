import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { trpc } from "../../utils/trpc";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import {
  createSentenceStructureDocumentFromSimplifiedSentenceStructureDocument,
  sentenceStructureDocumentToSimplifiedSentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";
import { useSentenceStructureDocument } from "../contexts/SentenceStructureDocumentProvider";

type ReviseSentenceStructureDocumentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReviseSentenceStructureDocumentDialog({
  isOpen,
  onClose,
}: ReviseSentenceStructureDocumentDialogProps) {
  const { sentenceStructureDocument, setSentenceStructureDocument } =
    useSentenceStructureDocument();

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

  const reviseSimplifiedSentenceStructureDocumentMutation = useMutation(
    trpc.reviseSimplifiedSentenceStructureDocument.mutationOptions(),
  );

  return (
    <Dialog fullWidth maxWidth="sm" open={isOpen} onClose={onClose}>
      <DialogTitle>AIで修正</DialogTitle>
      <DialogContent>
        <DialogContentText>
          現在の注釈をもとに、AIにどのように修正してほしいかを書いてください。
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="AIへの指示"
          placeholder="例：準動詞句や節の内部の注釈は省略してください。"
          fullWidth
          multiline
          minRows={4}
          value={userRevisionInstruction}
          disabled={reviseSimplifiedSentenceStructureDocumentMutation.isPending}
          onChange={(e) => {
            setUserRevisionInstruction(e.target.value);
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          disabled={userRevisionInstruction.trim() === ""}
          loading={reviseSimplifiedSentenceStructureDocumentMutation.isPending}
          loadingPosition="start"
          onClick={async () => {
            const trimmedUserRevisionInstruction =
              userRevisionInstruction.trim();
            if (!trimmedUserRevisionInstruction) return;

            try {
              const newSimplifiedSentenceStructureDocument =
                await reviseSimplifiedSentenceStructureDocumentMutation.mutateAsync(
                  {
                    userRevisionInstruction: trimmedUserRevisionInstruction,
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
            onClose();
          }}
        >
          修正を依頼
        </Button>
      </DialogActions>
    </Dialog>
  );
}
