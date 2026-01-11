import { SentenceStructureDataProvider } from "./contexts/SentenceStructureDataProvider";
import { ConfigurationsProvider } from "./contexts/ConfigurationsProvider";
import { InteractionStateProvider } from "./contexts/InteractionStateProvider";
import SentenceStructureEditor from "./components/SentenceStructureEditor";

export default function Home() {
  return (
    <SentenceStructureDataProvider>
      <ConfigurationsProvider>
        <InteractionStateProvider>
          <SentenceStructureEditor />
        </InteractionStateProvider>
      </ConfigurationsProvider>
    </SentenceStructureDataProvider>
  );
}
