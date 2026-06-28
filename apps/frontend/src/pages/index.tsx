import { SentenceStructureDocumentProvider } from "./contexts/SentenceStructureDocumentProvider";
import { SentenceStructureDiagramAnnotationSettingsProvider } from "./contexts/SentenceStructureDiagramAnnotationSettingsProvider";
import { SentenceStructureDiagramDisplaySettingsProvider } from "./contexts/SentenceStructureDiagramDisplaySettingsProvider";
import { InteractionStateProvider } from "./contexts/InteractionStateProvider";
import SentenceStructureEditor from "./components/SentenceStructureEditor";

export default function Home() {
  return (
    <SentenceStructureDocumentProvider>
      <SentenceStructureDiagramAnnotationSettingsProvider>
        <SentenceStructureDiagramDisplaySettingsProvider>
          <InteractionStateProvider>
            <SentenceStructureEditor />
          </InteractionStateProvider>
        </SentenceStructureDiagramDisplaySettingsProvider>
      </SentenceStructureDiagramAnnotationSettingsProvider>
    </SentenceStructureDocumentProvider>
  );
}
