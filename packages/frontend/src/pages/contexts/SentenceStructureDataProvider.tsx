import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  createSentenceStructureDataFromStringData,
  createSentenceStructureDataFromText,
  sentenceStructureDataToString,
  type SentenceStructureData,
} from "@sentence-structure-diagram-app/sentence-structure-data";

const initialText = "";

type SentenceStructureDataContextValue = {
  initialSentenceStructureData: SentenceStructureData;
  sentenceStructureData: SentenceStructureData;
  setSentenceStructureData: (
    newSentenceStructureData: SentenceStructureData,
  ) => void;
};

const SentenceStructureDataContext =
  createContext<SentenceStructureDataContextValue | null>(null);

export function SentenceStructureDataProvider(props: PropsWithChildren) {
  const [sentenceStructureData, _setSentenceStructureData] =
    useState<SentenceStructureData>(() => {
      const savedSentenceStructureData = localStorage.getItem(
        "sentenceStructureData",
      );
      if (!savedSentenceStructureData) {
        return createSentenceStructureDataFromText({ text: initialText });
      }
      const result = createSentenceStructureDataFromStringData(
        savedSentenceStructureData,
      );
      if (result.success) {
        return result.data.newSentenceStructureData;
      } else {
        return createSentenceStructureDataFromText({
          text: initialText,
        });
      }
    });

  function setSentenceStructureData(
    newSentenceStructureData: SentenceStructureData,
  ) {
    localStorage.setItem(
      "sentenceStructureData",
      sentenceStructureDataToString(newSentenceStructureData),
    );
    _setSentenceStructureData(newSentenceStructureData);
  }

  return (
    <SentenceStructureDataContext.Provider
      value={{
        initialSentenceStructureData: createSentenceStructureDataFromText({
          text: initialText,
        }),
        sentenceStructureData,
        setSentenceStructureData,
      }}
    >
      {props.children}
    </SentenceStructureDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSentenceStructureData() {
  const context = useContext(SentenceStructureDataContext);
  if (!context) {
    throw new Error(
      "useSentenceStructureData must be used within a SentenceStructureDataProvider",
    );
  }
  return context;
}
