// app/contexts/ProjectContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import type { ProjectResponse } from "~/types/project";
import { useParams } from "react-router";

interface ProjectContextType {
  project: ProjectResponse | null;
  setProject: (project: ProjectResponse | null) => void;
}

const defaultContext: ProjectContextType = {
  project: null,
  setProject: () => {},
};

export const ProjectContext = createContext<ProjectContextType>(defaultContext);

export const ProjectProvider: React.FC<{
  children: React.ReactNode;
  initialProject?: ProjectResponse | null;
}> = ({ children, initialProject = null }) => {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectResponse | null>(
    initialProject,
  );

  useEffect(() => {
    if (!id) {
      setProject(null);
    }
  }, [id]);

  // Update project when initialProject changes
  useEffect(() => {
    if (initialProject) {
      setProject(initialProject);
    }
  }, [initialProject]);

  return (
    <ProjectContext.Provider value={{ project, setProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
};
