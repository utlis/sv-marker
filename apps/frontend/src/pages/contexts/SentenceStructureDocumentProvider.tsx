import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  createSentenceStructureDocumentFromJSONString,
  createSentenceStructureDocumentFromText,
  sentenceStructureDocumentToJSONString,
  type SentenceStructureDocument,
} from "@sv-marker/sentence-structure-document";

const initialText = "";

type SentenceStructureDocumentContextValue = {
  sentenceStructureDocument: SentenceStructureDocument;
  setSentenceStructureDocument: (
    newSentenceStructureDocument: SentenceStructureDocument,
  ) => void;
};

const SentenceStructureDocumentContext =
  createContext<SentenceStructureDocumentContextValue | null>(null);

export function SentenceStructureDocumentProvider(props: PropsWithChildren) {
  const [sentenceStructureDocument, _setSentenceStructureDocument] =
    useState<SentenceStructureDocument>(() => {
      const storedSentenceStructureDocumentJSONString = localStorage.getItem(
        "sentence-structure-document",
      );
      if (!storedSentenceStructureDocumentJSONString) {
        return createSentenceStructureDocumentFromText(initialText);
      }

      const result = createSentenceStructureDocumentFromJSONString(
        storedSentenceStructureDocumentJSONString,
      );
      if (result.success) {
        return result.data.newSentenceStructureDocument;
      } else {
        return createSentenceStructureDocumentFromText(initialText);
      }
    });

  function setSentenceStructureDocument(
    newSentenceStructureDocument: SentenceStructureDocument,
  ) {
    localStorage.setItem(
      "sentence-structure-document",
      sentenceStructureDocumentToJSONString(newSentenceStructureDocument),
    );
    _setSentenceStructureDocument(newSentenceStructureDocument);
  }

  return (
    <SentenceStructureDocumentContext.Provider
      value={{
        sentenceStructureDocument,
        setSentenceStructureDocument,
      }}
    >
      {props.children}
    </SentenceStructureDocumentContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSentenceStructureDocument() {
  const context = useContext(SentenceStructureDocumentContext);
  if (!context) {
    throw new Error(
      "useSentenceStructureDocument must be used within a SentenceStructureDocumentProvider",
    );
  }
  return context;
}
