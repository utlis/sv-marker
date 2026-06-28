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

const annotationPresetNameOptions = [
  "non-reflow-annotation",
  "reflow-annotation",
] as const;
type AnnotationPresetName = (typeof annotationPresetNameOptions)[number];

type SentenceStructureDiagramAnnotationSettingsContextValue = {
  resolvedSentenceStructureDiagramNotation: SentenceStructureDiagramNotation;
  annotationPresetName: AnnotationPresetName;
  setAnnotationPresetName: (
    newAnnotationPresetName: AnnotationPresetName,
  ) => void;
  canvasWidth: number;
  setCanvasWidth: (newCanvasWidth: number) => void;
};

const SentenceStructureDiagramAnnotationSettingsContext =
  createContext<SentenceStructureDiagramAnnotationSettingsContextValue | null>(
    null,
  );

export function SentenceStructureDiagramAnnotationSettingsProvider(
  props: PropsWithChildren,
) {
  const [annotationPresetName, _setAnnotationPresetName] =
    useState<AnnotationPresetName>(() => {
      const storedAnnotationPresetName = localStorage.getItem(
        "sentence-structure-diagram-annotation-preset-name",
      );
      if (!storedAnnotationPresetName) {
        return "non-reflow-annotation";
      }

      return annotationPresetNameOptions.includes(
        storedAnnotationPresetName as AnnotationPresetName,
      )
        ? (storedAnnotationPresetName as AnnotationPresetName)
        : "non-reflow-annotation";
    });

  function setAnnotationPresetName(
    newAnnotationPresetName: AnnotationPresetName,
  ) {
    localStorage.setItem(
      "sentence-structure-diagram-annotation-preset-name",
      newAnnotationPresetName,
    );
    _setAnnotationPresetName(newAnnotationPresetName);
  }

  const [canvasWidth, setCanvasWidth] = useState<number>(
    presets["non-reflow-annotation"].canvas.width,
  );

  const resolvedSentenceStructureDiagramNotation = {
    ...presets[annotationPresetName],
    canvas: {
      ...presets[annotationPresetName].canvas,
      width: canvasWidth,
    },
  };

  return (
    <SentenceStructureDiagramAnnotationSettingsContext.Provider
      value={{
        resolvedSentenceStructureDiagramNotation,
        annotationPresetName,
        setAnnotationPresetName,
        canvasWidth,
        setCanvasWidth,
      }}
    >
      {props.children}
    </SentenceStructureDiagramAnnotationSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSentenceStructureDiagramAnnotationSettings() {
  const context = useContext(SentenceStructureDiagramAnnotationSettingsContext);
  if (!context) {
    throw new Error(
      "useSentenceStructureDiagramAnnotationSettings must be used within a SentenceStructureDiagramAnnotationSettingsProvider",
    );
  }
  return context;
}
