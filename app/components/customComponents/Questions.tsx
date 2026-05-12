import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Download,
  Loader2,
  Mail,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import {
  askAnswer,
  exportQuestionnaire,
  giveAnswer,
} from "~/api/questionnaire";
import { Button } from "~/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useAuth } from "~/context/AuthContext";
import { EQueryKey } from "~/constants/queryKeys";
import { useEffectiveSubsystemId } from "~/hooks/useEffectiveSubsystemId";
import { cn } from "~/lib/utils";
import {
  EAnswerSource,
  type QuestionnaireQuestion,
  type QuestionnaireSection,
} from "~/types/systemResponse";
import { CreatingStatus } from "~/types/project";

interface IQuestionsProps {
  questionnaire: QuestionnaireSection[];
  onViewPrice?: () => void;
  onViewDesign?: () => void;
  onViewProposal?: () => void;
  isProposalUnlocked?: boolean;
  projectCreatingStatus?: CreatingStatus;
}

const EMAIL_TEMPLATE = `Hello [Name],

To ensure the proposal and sizing we prepare are as accurate and tailored to your needs as possible, we have put together a questionnaire covering the key areas we would like to clarify before proceeding.

Please find it attached. Kindly complete and return it at your earliest convenience, and we will get back to you with a detailed proposal within [X business days] of receiving your responses.

Should you have any questions or prefer to go through the questionnaire over a call, please do not hesitate to reach out – we are happy to arrange that.

Best regards,
[Your Name]`;

function getFieldName(question: QuestionnaireQuestion) {
  return `q_${question.id}`;
}

// Helper component to conditionally wrap form controls with tooltips
interface FormItemWithTooltipProps {
  children: React.ReactNode;
  answerSource: EAnswerSource | string | null;
  className?: string;
  isSelect?: boolean; // Flag to handle Select components differently
  answer?: string | null; // Add answer prop to check if it's empty
}

const FormItemWithTooltip: React.FC<FormItemWithTooltipProps> = ({
  children,
  answerSource,
  className,
  answer,
}) => {
  const withTooltip =
    (answerSource === EAnswerSource.Rfp || answerSource === EAnswerSource.Ai) &&
    answer &&
    answer.trim() !== "";

  const tooltipMessage =
    answerSource === EAnswerSource.Rfp
      ? "The answer is extracted from RFP"
      : "Generated with Magic Wand";

  return (
    <FormItem className={cn("w-full overflow-hidden", className)}>
      <FormControl>
        <Tooltip disableHoverableContent={!withTooltip} delayDuration={200}>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          {withTooltip && <TooltipContent>{tooltipMessage}</TooltipContent>}
        </Tooltip>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

const Questions = ({
  questionnaire,
  onViewPrice,
  onViewDesign,
  onViewProposal,
  isProposalUnlocked,
  projectCreatingStatus,
}: IQuestionsProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { id, systemId } = useParams();
  const projectId = id ? String(id) : "";
  const { effectiveSubsystemId } = useEffectiveSubsystemId();
  const { account } = useAuth();
  const [loadingQuestionId, setLoadingQuestionId] = useState<number | null>(
    null,
  );
  const [savingQuestionId, setSavingQuestionId] = useState<number | null>(null);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
    {},
  );
  const { data: isUseCasesGeneratedCache = false } = useQuery({
    queryKey: [EQueryKey.USE_CASES_GENERATED, projectId],
    queryFn: () => false,
    enabled: false,
    initialData: false,
  });
  const isUseCasesGenerated = isUseCasesGeneratedCache;
  const isProjectCompleted = projectCreatingStatus === CreatingStatus.COMPLETED;
  const canPreviewProposal =
    isProjectCompleted && (isProposalUnlocked || isUseCasesGenerated);

  // Collapsible state
  const [openSections, setOpenSections] = useState<Record<number, boolean>>(
    Object.fromEntries(questionnaire.map((s) => [s.id, true])),
  );
  const toggleSection = useCallback((sid: number) => {
    setOpenSections((prev) => ({ ...prev, [sid]: !prev[sid] }));
  }, []);

  // Schema & default values
  const { schema, defaultValues } = useMemo(() => {
    const fields: Record<string, any> = {};
    const defaults: Record<string, any> = {};
    questionnaire.forEach((section) => {
      section.questions.forEach((q) => {
        const name = getFieldName(q);
        // fields[name] = q.mandatory
        //   ? z.string().min(1, "Required")
        //   : z.string().optional();
        defaults[name] = q.answer ?? "";
      });
    });
    return { schema: z.object(fields), defaultValues: defaults };
  }, [questionnaire]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onBlur",
  });

  const handleBlur = (q: QuestionnaireQuestion, value: string) => {
    // Always reset the editing state first
    const fieldName = getFieldName(q);
    setEditingFields((prev) => ({ ...prev, [fieldName]: false }));

    // Only send to server if mandatory validation passes and value changed
    // if (q.mandatory && (!value || value.trim() === "")) return;

    // Compare with the original questionnaire value instead of current form value
    if (q.answer === value) return;

    saveMutation.mutate({ questionId: q.id, answer: value });
  };

  // Обработчик фокуса для отслеживания редактируемых полей
  const handleFocus = useCallback((fieldName: string) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
  }, []);

  // keep form in sync with server without resetting fields being edited
  useEffect(() => {
    const updated: Record<string, any> = {};
    questionnaire.forEach((s) =>
      s.questions.forEach((q) => {
        const fieldName = getFieldName(q);
        // Используем editingFields вместо dirtyFields для точного определения
        if (!editingFields[fieldName]) {
          updated[fieldName] = q.answer ?? "";
        }
      }),
    );
    // Only reset if there are fields to update
    if (Object.keys(updated).length > 0) {
      form.reset(
        { ...form.getValues(), ...updated },
        { keepDirtyValues: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionnaire]);

  // =========== answer source overrides ===========
  const [localAnswerSources, setLocalAnswerSources] = useState<
    Record<string, EAnswerSource>
  >({});

  const markAsUser = useCallback((fieldName: string) => {
    setLocalAnswerSources((prev) => {
      if (prev[fieldName] === EAnswerSource.User) return prev;
      return { ...prev, [fieldName]: EAnswerSource.User };
    });
  }, []);

  // === mutations ===
  const saveMutation = useMutation({
    mutationFn: ({
      questionId,
      answer,
    }: {
      questionId: number;
      answer: string;
    }) => giveAnswer(questionId, { answer }),
    onMutate: (data) => {
      setSavingQuestionId(data.questionId);
    },
    onSuccess: () => {
      if (id && !systemId) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_DATA, id],
        });
      } else if (id && effectiveSubsystemId) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
        });
      }
    },
    onSettled: () => {
      setSavingQuestionId(null);
    },
  });

  const getClasses = useCallback(
    (question: QuestionnaireQuestion, fieldName: string) => {
      if (
        editingFields[fieldName] ||
        loadingQuestionId === question.id ||
        savingQuestionId === question.id
      ) {
        return {
          "text-black": true,
        };
      }

      const src = localAnswerSources[fieldName] ?? question.answer_source;
      return {
        "text-black": src === EAnswerSource.User || question.answer === null,
        "text-primary italic": src === EAnswerSource.Ai,
        "text-[#D19B5D] italic": src === EAnswerSource.Rfp,
      };
    },
    [localAnswerSources, editingFields],
  );

  const askMutation = useMutation({
    mutationFn: (qid: number) => askAnswer(qid),
    onMutate: (qid) => setLoadingQuestionId(qid),
    onSettled: (data) => {
      setLoadingQuestionId(null);
      if (data) {
        const fn = getFieldName(data);
        form.setValue(fn, data.answer);
        setLocalAnswerSources((prev) => ({ ...prev, [fn]: EAnswerSource.Ai }));
      }
    },
    onSuccess: () => {
      setEditingFields({});
      if (id && !systemId) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_DATA, id],
        });
      } else if (id && effectiveSubsystemId) {
        queryClient.invalidateQueries({
          queryKey: [EQueryKey.PROJECT_SUBSYSTEM, id, effectiveSubsystemId],
        });
      }
    },
  });

  useEffect(() => setLocalAnswerSources({}), [questionnaire]);

  const { mutate: exportQuestionnaireMutation, isPending: isExporting } =
    useMutation({
      mutationFn: () => exportQuestionnaire(projectId, effectiveSubsystemId),
    });

  const hasQuestions = questionnaire.length > 0;

  const handleCopyEmailTemplate = useCallback(async () => {
    await navigator.clipboard.writeText(EMAIL_TEMPLATE);
    toast.success("Email template copied to clipboard");
  }, []);

  // ================= render =================
  return (
    <div className="flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[24px] font-bold leading-[140%] font-[Roboto_Serif] text-[#3a3540]">
          Questions
        </h2>
        {hasQuestions && (
          <div className="flex items-center gap-2 self-end">
            <Button
              variant="ghost"
              className="bg-[#EEF3F9] rounded-none px-5 py-3 relative text-primary h-10 w-[180px] justify-center"
              onClick={() => exportQuestionnaireMutation()}
              disabled={!projectId || isExporting || !hasQuestions}
            >
              {isExporting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Download /> Export questions
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="bg-[#EEF3F9] rounded-none px-5 py-3 relative text-primary h-10 justify-center gap-2"
              onClick={handleCopyEmailTemplate}
            >
              <Mail /> Email template
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Form {...form}>
          {questionnaire.map((section) => (
            <Collapsible
              key={section.id}
              className="border border-gray-300 px-6 py-5 flex flex-col gap-6"
              open={openSections[section.id]}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer">
                  <h4 className="text-black text-[18px] font-bold leading-[150%]">
                    {section.name}
                  </h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-none"
                  >
                    <ChevronDown
                      className={cn("size-8 transition-transform", {
                        "rotate-180": openSections[section.id],
                      })}
                      strokeWidth={1}
                    />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="flex flex-col gap-3">
                {section.questions
                  .sort((a, b) => a.id - b.id)
                  .map((q) => {
                    const fieldName = getFieldName(q);
                    return (
                      <FormField
                        key={q.id}
                        control={form.control}
                        name={fieldName}
                        render={({ field, fieldState }) => (
                          <div className="flex justify-between gap-6 w-full">
                            <p className="text-black text-base leading-[150%] w-1/2 overflow-hidden text-ellipsis">
                              {q.question} {/*{q.mandatory && (*/}
                              {/*  <span className="text-red-500">*</span>*/}
                              {/*)}*/}
                            </p>

                            <div className="w-full max-w-1/2 flex gap-3 overflow-hidden">
                              {/* TEXT / STRING */}
                              {(q.answer_type === "text" ||
                                q.answer_type === "string") && (
                                <FormItemWithTooltip
                                  answerSource={
                                    localAnswerSources[fieldName] ??
                                    q.answer_source
                                  }
                                  answer={field.value}
                                >
                                  <Textarea
                                    {...field}
                                    className={cn(
                                      "border p-2 resize-none w-full break-words max-h-32 overflow-y-auto overflow-x-hidden transition-colors duration-300",
                                      {
                                        "border-red-500": fieldState.error,
                                        ...getClasses(q, fieldName),
                                      },
                                    )}
                                    placeholder="Enter your answer"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      markAsUser(fieldName);
                                    }}
                                    onFocus={() => handleFocus(fieldName)}
                                    onBlur={(e) => {
                                      field.onBlur();
                                      handleBlur(q, e.target.value);
                                    }}
                                  />
                                </FormItemWithTooltip>
                              )}

                              {/* NUMBER */}
                              {q.answer_type === "number" && (
                                <FormItemWithTooltip
                                  answerSource={
                                    localAnswerSources[fieldName] ??
                                    q.answer_source
                                  }
                                  answer={field.value}
                                >
                                  <Input
                                    type="number"
                                    {...field}
                                    className={cn(
                                      "border p-2 transition-colors duration-300 overflow-hidden text-ellipsis",
                                      {
                                        "border-red-500": fieldState.error,
                                        ...getClasses(q, fieldName),
                                      },
                                    )}
                                    placeholder="Enter your answer"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      markAsUser(fieldName);
                                    }}
                                    onFocus={() => handleFocus(fieldName)}
                                    onBlur={(e) => {
                                      field.onBlur();
                                      handleBlur(q, e.target.value);
                                    }}
                                  />
                                </FormItemWithTooltip>
                              )}

                              {/* DATE */}
                              {q.answer_type === "date" && (
                                <FormItemWithTooltip
                                  answerSource={
                                    localAnswerSources[fieldName] ??
                                    q.answer_source
                                  }
                                  answer={field.value}
                                >
                                  <Input
                                    type="date"
                                    {...field}
                                    className={cn(
                                      "border p-2 transition-colors duration-300",
                                      {
                                        "border-red-500": fieldState.error,
                                        ...getClasses(q, fieldName),
                                      },
                                    )}
                                    placeholder="Enter your answer"
                                    onChange={(e) => {
                                      field.onChange(e.target.value);
                                      markAsUser(fieldName);
                                    }}
                                    onFocus={() => handleFocus(fieldName)}
                                    onBlur={(e) => {
                                      field.onBlur();
                                      handleBlur(q, e.target.value);
                                    }}
                                  />
                                </FormItemWithTooltip>
                              )}

                              {/* OPTION */}
                              {q.answer_type === "option" && (
                                <FormItemWithTooltip
                                  answerSource={
                                    localAnswerSources[fieldName] ??
                                    q.answer_source
                                  }
                                  answer={field.value}
                                  isSelect
                                >
                                  <Select
                                    value={field.value || ""}
                                    onValueChange={(value) => {
                                      field.onChange(value);
                                      handleBlur(q, value);
                                      markAsUser(fieldName);
                                    }}
                                    onOpenChange={(open) => {
                                      if (open) handleFocus(fieldName);
                                    }}
                                  >
                                    {(q.answer_source === EAnswerSource.Rfp ||
                                      q.answer_source === EAnswerSource.Ai ||
                                      localAnswerSources[fieldName] ===
                                        EAnswerSource.Rfp ||
                                      localAnswerSources[fieldName] ===
                                        EAnswerSource.Ai) &&
                                    field.value &&
                                    field.value.trim() !== "" ? (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <SelectTrigger
                                            className={cn(
                                              "w-full transition-colors duration-300 overflow-hidden text-ellipsis",
                                              {
                                                "border-red-500":
                                                  fieldState.error,
                                                ...getClasses(q, fieldName),
                                              },
                                            )}
                                          >
                                            <SelectValue
                                              placeholder="Select an option"
                                              className="overflow-hidden text-ellipsis"
                                            />
                                          </SelectTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {(localAnswerSources[fieldName] ??
                                            q.answer_source) ===
                                          EAnswerSource.Rfp
                                            ? "The answer is extracted from RFP"
                                            : "Generated with Magic Wand"}
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      <SelectTrigger
                                        className={cn(
                                          "w-full transition-colors duration-300 overflow-hidden text-ellipsis",
                                          {
                                            "border-red-500": fieldState.error,
                                            ...getClasses(q, fieldName),
                                          },
                                        )}
                                      >
                                        <SelectValue
                                          placeholder="Select an option"
                                          className="overflow-hidden text-ellipsis"
                                        />
                                      </SelectTrigger>
                                    )}

                                    <SelectContent>
                                      {q.answer_options.map((opt) => (
                                        <SelectItem
                                          key={opt}
                                          value={opt}
                                          className="overflow-hidden text-ellipsis"
                                        >
                                          {opt}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormItemWithTooltip>
                              )}

                              {/* MAGIC WAND BUTTON */}
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => askMutation.mutate(q.id)}
                                className="bg-transparent"
                              >
                                {loadingQuestionId === q.id ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <WandSparkles color="#37B0F1" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      />
                    );
                  })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </Form>

        {/* Footer buttons */}
        <div className="flex gap-3 justify-end">
          {onViewPrice && (
            <Button className="px-6" onClick={onViewPrice}>
              View Price
            </Button>
          )}
          {onViewDesign && (
            <Button className="px-6" onClick={onViewDesign}>
              View Design
            </Button>
          )}
          {onViewProposal &&
            (canPreviewProposal ? (
              <Button className="px-6" onClick={onViewProposal}>
                Preview Proposal
              </Button>
            ) : (
              <Button
                className="px-6"
                disabled={!projectId || !isProjectCompleted}
                onClick={() => {
                  if (!projectId) return;
                  navigate(`/projects/${projectId}?tab=use_cases`);
                }}
              >
                Use cases
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Questions;
