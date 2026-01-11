import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import {
  defaultConfigurations,
  stringToConfigurations,
  xmlStringToConfigurations,
  type Configurations,
} from "@sentence-structure-diagram-app/sentence-structure-diagram-configurations";

type ConfigurationsContextValue = {
  configurations: Configurations;
  setConfigurations: (newConfigurations: Configurations) => void;
  setConfigurationsFromXMLData: (xmlString: string) => void;
};

const ConfigurationsContext = createContext<ConfigurationsContextValue | null>(
  null,
);

export function ConfigurationsProvider(props: PropsWithChildren) {
  const [configurations, _setConfigurations] = useState<Configurations>(() => {
    const savedConfigurations = localStorage.getItem("configurations");
    if (!savedConfigurations) {
      return defaultConfigurations;
    }
    const result = stringToConfigurations.safeDecode(savedConfigurations);
    if (result.success) {
      return result.data;
    } else {
      return defaultConfigurations;
    }
  });

  function setConfigurations(newConfigurations: Configurations) {
    const result = stringToConfigurations.safeEncode(newConfigurations);
    if (result.success) {
      localStorage.setItem("configurations", result.data);
    }
    _setConfigurations(newConfigurations);
  }

  function setConfigurationsFromXMLData(xmlString: string) {
    setConfigurations(xmlStringToConfigurations.decode(xmlString));
  }

  return (
    <ConfigurationsContext.Provider
      value={{
        configurations,
        setConfigurations,
        setConfigurationsFromXMLData,
      }}
    >
      {props.children}
    </ConfigurationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useConfigurations() {
  const context = useContext(ConfigurationsContext);
  if (!context) {
    throw new Error(
      "useConfigurations must be used within a ConfigurationsProvider",
    );
  }
  return context;
}
