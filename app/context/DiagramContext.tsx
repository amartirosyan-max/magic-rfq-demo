import React, { useContext, useState } from "react";

export type Diagram = "dell" | "nvidia";

interface DiagramContextType {
  diagram: Diagram;
  setDiagram: (value: Diagram) => void;
}

export const DiagramContext = React.createContext<DiagramContextType>({
  diagram: "dell",
  setDiagram: () => {},
});

export const useDiagram = () => useContext(DiagramContext);

export const DiagramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [diagram, setDiagram] = useState<Diagram>("dell");

  return (
    <DiagramContext.Provider value={{ diagram, setDiagram }}>
      {children}
    </DiagramContext.Provider>
  );
};
