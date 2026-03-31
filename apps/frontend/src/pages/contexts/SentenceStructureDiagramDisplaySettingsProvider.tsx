import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  presets,
  type SentenceStructureDiagramNotation,
} from "@sv-marker/sentence-structure-diagram-notation";

type SentenceStructureDiagramDisplaySettings =
  | {
      presetName: keyof typeof presets;
    }
  | {
      presetName: null;
      sentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
    };

type SentenceStructureDiagramDisplaySettingsContextValue = {
  resolvedSentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
  sentenceStructureDiagramDisplaySettings: SentenceStructureDiagramDisplaySettings;
  setSentenceStructureDiagramDisplaySettings: (
    newSentenceStructureDiagramDisplaySettings: SentenceStructureDiagramDisplaySettings,
  ) => void;
};

const SentenceStructureDiagramDisplaySettingsContext =
  createContext<SentenceStructureDiagramDisplaySettingsContextValue | null>(
    null,
  );

export function SentenceStructureDiagramDisplaySettingsProvider(
  props: PropsWithChildren,
) {
  const [
    sentenceStructureDiagramDisplaySettings,
    _setSentenceStructureDiagramDisplaySettings,
  ] = useState<SentenceStructureDiagramDisplaySettings>(() => {
    try {
      const storedSentenceStructureDiagramDisplaySettings =
        localStorage.getItem("sentence-structure-diagram-display-settings");
      if (!storedSentenceStructureDiagramDisplaySettings) {
        return { presetName: "reflow-diagram" };
      }

      return JSON.parse(storedSentenceStructureDiagramDisplaySettings);
    } catch {
      return { presetName: "reflow-diagram" };
    }
  });

  function setSentenceStructureDiagramDisplaySettings(
    newSentenceStructureDiagramDisplaySettings: SentenceStructureDiagramDisplaySettings,
  ) {
    localStorage.setItem(
      "sentence-structure-diagram-display-settings",
      JSON.stringify(newSentenceStructureDiagramDisplaySettings),
    );
    _setSentenceStructureDiagramDisplaySettings(
      newSentenceStructureDiagramDisplaySettings,
    );
  }

  const resolvedSentenceStructureDiagramNotation =
    sentenceStructureDiagramDisplaySettings.presetName
      ? presets[sentenceStructureDiagramDisplaySettings.presetName]
      : sentenceStructureDiagramDisplaySettings.sentenceStructureDiagramNotation;

  return (
    <SentenceStructureDiagramDisplaySettingsContext.Provider
      value={{
        resolvedSentenceStructureDiagramNotation,
        sentenceStructureDiagramDisplaySettings,
        setSentenceStructureDiagramDisplaySettings,
      }}
    >
      {props.children}
    </SentenceStructureDiagramDisplaySettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSentenceStructureDiagramDisplaySettings() {
  const context = useContext(SentenceStructureDiagramDisplaySettingsContext);
  if (!context) {
    throw new Error(
      "useSentenceStructureDiagramDisplaySettings must be used within a SentenceStructureDiagramDisplaySettingsProvider",
    );
  }
  return context;
}
