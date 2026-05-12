import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { getProject } from "~/api/projects";
import ProjectTitleReadonly from "~/components/customComponents/ProjectTitleReadonly";
import LeadRejectionMessage from "~/components/lead-score/LeadRejectionMessage";
import { EQueryKey } from "~/constants/queryKeys";
import { parseLeadScore } from "~/lib/utils";

const LeadScore = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: project,
    isPending,
    isError,
  } = useQuery({
    queryKey: [EQueryKey.PROJECT_DATA, id],
    queryFn: () => getProject(String(id)),
    enabled: !!id,
  });
  const leadScoreValue = parseLeadScore(project?.lead_score);

  useEffect(() => {
    if (isError) {
      navigate("/dashboard", { replace: true });
    }
  }, [isError, navigate]);

  useEffect(() => {
    if (!id || !project || Number.isNaN(leadScoreValue)) return;
    if (leadScoreValue > 2.0) {
      navigate(`/projects/${id}`, { replace: true });
    }
  }, [id, leadScoreValue, navigate, project]);

  if (isPending || !project) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pt-10">
      <ProjectTitleReadonly
        title={project.name}
        description={project.description}
      />
      <LeadRejectionMessage />
    </div>
  );
};

export default LeadScore;
