import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, Row } from "@tanstack/react-table";
import dayjs from "dayjs";
import { Check, Clock, MoreVertical, Search, Trash, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  deleteFeedback,
  getFeedbackHistory,
  type IFeedbackHistoryItem,
} from "~/api/feedback";
import { deleteProject } from "~/api/projects";
import {
  type IProductRequestResponse,
  type ProductRequestStatus,
  createProductRequest,
  deleteProductRequest,
  getProductRequests,
} from "~/api/productRequests";
import type { IUserResponse } from "~/api/users";
import {
  createUser,
  deleteUser,
  getUsers,
  isAdminRole,
  updateUser,
} from "~/api/users";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import { DeleteFeedbackModal } from "~/components/ui/delete-feedback-modal";
import { DeleteProjectModal } from "~/components/ui/delete-project-modal";
import { DeleteProductRequestModal } from "~/components/ui/delete-product-request-modal";
import { DeleteUserModal } from "~/components/ui/delete-user-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { QualityStatusIcon } from "~/components/ui/quality-status-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { EQueryKey } from "~/constants/queryKeys";
import { useAuth } from "~/context/AuthContext";
import { CreateProductRequestSidebar } from "~/features/add-product";
import { CreateUserSidebar } from "~/features/add-user";
import type { ProjectResponse } from "~/types/project";

const productRequestStatusStyles: Record<
  ProductRequestStatus,
  {
    bg: string;
    border: string;
    color: string;
    icon: typeof Check;
    label: string;
  }
> = {
  ADDED: {
    bg: "#ECFDF3",
    border: "#ABEFC6",
    color: "#067647",
    icon: Check,
    label: "Added",
  },
  PENDING: {
    bg: "#FFFAEB",
    border: "#FEDF89",
    color: "#B54708",
    icon: Clock,
    label: "Pending",
  },
  DECLINED: {
    bg: "#FEF3F2",
    border: "#FECDCA",
    color: "#B42318",
    icon: X,
    label: "Declined",
  },
};

type ProjectsViewProps = {
  projects: ProjectResponse[];
  onRowClick?: (row: Row<ProjectResponse>) => void;
  /** При клике по статусу good/suggestion в таблицах Projects/Feedback — переход на Proposal с скроллом к секции */
  onProposalSectionClick?: (projectId: number, sectionIndex: number) => void;
};

const getInitials = (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    const word = parts[0];
    return word.length <= 1
      ? word.toUpperCase()
      : word.slice(0, 2).toUpperCase();
  }
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return `${first}${second}`.toUpperCase();
};

const baseUserColumns: ColumnDef<IUserResponse>[] = [
  {
    id: "user",
    header: "User",
    cell: ({ row }) => {
      const u = row.original;
      const initials = getInitials(u.name);
      return (
        <div className="flex items-center gap-3 min-w-48">
          <Avatar className="h-10 w-10 rounded-full">
            <AvatarFallback className="h-10 w-10 rounded-full text-[14px] leading-[20px] font-semibold text-[#181D27]">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
              {u.name}
            </span>
            <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
              {u.organization_name}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    id: "division",
    header: "Division",
    accessorKey: "division",
    cell: ({ row }) => (
      <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
        {row.original.division || "—"}
      </span>
    ),
  },
  {
    id: "location",
    header: "Location",
    accessorKey: "location",
    cell: ({ row }) => (
      <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
        {row.original.location || "—"}
      </span>
    ),
  },
  {
    id: "email",
    header: "Email",
    accessorKey: "email",
    cell: ({ row }) => (
      <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
        {row.original.email}
      </span>
    ),
  },
  {
    id: "login",
    header: "Login",
    accessorKey: "login",
    cell: ({ row }) => (
      <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
        {row.original.login}
      </span>
    ),
  },
];

const ProjectsView = ({
  projects,
  onRowClick,
  onProposalSectionClick,
}: ProjectsViewProps) => {
  const { account } = useAuth();
  const canAccessAdminTabs = isAdminRole(account?.role);
  const [activeTab, setActiveTab] = useState("projects");

  useEffect(() => {
    if (
      account != null &&
      !canAccessAdminTabs &&
      (activeTab === "users" ||
        activeTab === "feedback" ||
        activeTab === "product-requests")
    ) {
      setActiveTab("projects");
    }
  }, [account, canAccessAdminTabs, activeTab]);
  const [search, setSearch] = useState("");
  const [organization, setOrganization] = useState("all");
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectResponse | null>(null);
  const [openActionsRowId, setOpenActionsRowId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<IUserResponse | null>(null);
  const [openActionsRowIdUser, setOpenActionsRowIdUser] = useState<
    number | null
  >(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [createUserSidebarOpen, setCreateUserSidebarOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<IUserResponse | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [openActionsRowIdFeedback, setOpenActionsRowIdFeedback] = useState<
    string | null
  >(null);
  const [feedbackToDelete, setFeedbackToDelete] =
    useState<IFeedbackHistoryItem | null>(null);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);
  const [productRequestToDelete, setProductRequestToDelete] =
    useState<IProductRequestResponse | null>(null);
  const [openActionsRowIdProductRequest, setOpenActionsRowIdProductRequest] =
    useState<number | null>(null);
  const [isDeletingProductRequest, setIsDeletingProductRequest] =
    useState(false);
  const [createProductRequestSidebarOpen, setCreateProductRequestSidebarOpen] =
    useState(false);
  const [isCreatingProductRequest, setIsCreatingProductRequest] =
    useState(false);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: [EQueryKey.USERS],
    queryFn: getUsers,
    enabled: activeTab === "users" || activeTab === "product-requests",
  });

  const { data: productRequests = [], isLoading: productRequestsLoading } =
    useQuery({
      queryKey: [EQueryKey.PRODUCT_REQUESTS],
      queryFn: getProductRequests,
      enabled: activeTab === "product-requests",
    });

  const { data: feedbackHistory = [], isLoading: feedbackLoading } = useQuery({
    queryKey: [EQueryKey.FEEDBACK_HISTORY],
    queryFn: getFeedbackHistory,
    enabled: activeTab === "feedback" && canAccessAdminTabs,
  });

  const userColumns = useMemo<ColumnDef<IUserResponse>[]>(
    () => [
      ...baseUserColumns,
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const user = row.original;
          const isOpen = openActionsRowIdUser === user.id;
          return (
            <DropdownMenu
              open={isOpen}
              onOpenChange={(open) =>
                setOpenActionsRowIdUser(open ? user.id : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenActionsRowIdUser(null);
                    setUserToEdit(user);
                    setCreateUserSidebarOpen(true);
                  }}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenActionsRowIdUser(null);
                    setUserToDelete(user);
                  }}
                >
                  Delete <Trash className="ml-2 h-4 w-4 text-red-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [openActionsRowIdUser],
  );

  const filterOrganizationOptions = useMemo(() => {
    const names = new Set<string>();
    if (account?.organization_name?.trim()) {
      names.add(account.organization_name.trim());
    }
    projects.forEach((p) => {
      if (p.organization_name?.trim()) names.add(p.organization_name.trim());
    });
    users.forEach((u) => {
      if (u.organization_name?.trim()) names.add(u.organization_name.trim());
    });
    productRequests.forEach((pr) => {
      const u = users.find((x) => x.id === pr.user_id);
      if (u?.organization_name?.trim()) names.add(u.organization_name.trim());
    });
    if (userToEdit?.organization_name?.trim()) {
      names.add(userToEdit.organization_name.trim());
    }
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({ value: name, name }));
  }, [account, projects, users, userToEdit, productRequests]);

  const organizationOptions = useMemo(() => {
    const byId = new Map<number, string>();
    if (
      account?.organization_id != null &&
      account?.organization_name?.trim()
    ) {
      byId.set(account.organization_id, account.organization_name.trim());
    }
    users.forEach((u) => {
      if (u.organization_id != null && u.organization_name?.trim()) {
        byId.set(u.organization_id, u.organization_name.trim());
      }
    });
    if (
      userToEdit?.organization_id != null &&
      userToEdit.organization_name?.trim()
    ) {
      byId.set(userToEdit.organization_id, userToEdit.organization_name.trim());
    }
    return Array.from(byId.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [account, users, userToEdit]);

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesOrganization =
        organization === "all" ||
        project.organization_name?.trim() === organization;
      if (!matchesOrganization) return false;

      if (!normalizedSearch) return true;
      const haystack = [
        project.client_name,
        project.name,
        project.description,
        project.organization_name,
        project.user_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [projects, search, organization]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (organization !== "all") {
      list = list.filter((u) => u.organization_name?.trim() === organization);
    }
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return list;
    return list.filter((u) => {
      const haystack = [
        u.name,
        u.email,
        u.login,
        u.division ?? "",
        u.location ?? "",
        u.organization_name ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [users, organization, search]);

  const filteredFeedbackHistory = useMemo(() => {
    let list = feedbackHistory;
    if (organization !== "all") {
      list = list.filter(
        (item) => item.organization_name?.trim() === organization,
      );
    }
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return list;
    return list.filter((item) => {
      const sectionText = (item.sections ?? [])
        .flatMap((s) => [s.section_title, s.comment ?? ""])
        .join(" ");
      const haystack = [
        item.user_name,
        item.project_name,
        item.project_description,
        item.organization_name ?? "",
        sectionText,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [feedbackHistory, organization, search]);

  const filteredProductRequests = useMemo(() => {
    let list = productRequests;
    if (organization !== "all") {
      list = list.filter((pr) => {
        const u = users.find((x) => x.id === pr.user_id);
        return u?.organization_name?.trim() === organization;
      });
    }
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return list;
    return list.filter((pr) => {
      const userName = users.find((u) => u.id === pr.user_id)?.name ?? "";
      const haystack = [
        pr.name,
        pr.category ?? "",
        pr.description ?? "",
        pr.comments ?? "",
        userName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [productRequests, users, organization, search]);

  const columns = useMemo<ColumnDef<ProjectResponse>[]>(
    () => [
      {
        id: "profile",
        header: "Profile",
        cell: ({ row }) => {
          const userName = row.original.user_name || "Person name";
          const organizationName = row.original.organization_name;
          const avatarUrl = (row.original as { avatar_url?: string | null })
            .avatar_url;
          const initials = getInitials(userName);

          return (
            <div className="flex items-center gap-3 min-w-48">
              <Avatar className="h-10 w-10 rounded-full">
                {avatarUrl && (
                  <AvatarImage
                    src={avatarUrl}
                    alt={userName}
                    className="rounded-full"
                  />
                )}
                <AvatarFallback className="h-10 w-10 rounded-full text-[14px] leading-[20px] font-semibold text-[#181D27]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                  {userName}
                </span>
                <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                  {organizationName}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "project",
        header: "Project",
        accessorFn: (row) => row.client_name,
        cell: ({ row }) => {
          const clientName = row.original.client_name;
          const projectName = row.original.name;

          return (
            <div className="flex flex-col items-start text-ellipsis overflow-hidden text-wrap">
              <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                {clientName}
              </span>
              <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                {projectName}
              </span>
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <div className="text-ellipsis overflow-hidden text-wrap text-[14px] leading-[20px] font-normal text-[#414651]">
            {row.original.description}
          </div>
        ),
      },
      {
        id: "deadline",
        header: "Deadline",
        cell: ({ row }) => {
          const submissionDeadline = row.original.submission_deadline;
          const formattedDeadline =
            submissionDeadline &&
            dayjs(submissionDeadline).isValid() &&
            !submissionDeadline.startsWith("0000-")
              ? dayjs(submissionDeadline).format("MMM D, YYYY")
              : "—";
          return (
            <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
              {formattedDeadline}
            </span>
          );
        },
      },
      {
        id: "quality",
        header: "Quality / Readiness",
        cell: ({ row }) => {
          const project = row.original;
          const feedbacks = project.feedbacks;
          const statuses = feedbacks?.length
            ? feedbacks.map((f) => f.feedback_status)
            : [undefined];
          return (
            <div className="flex items-center gap-[10px]">
              {statuses.map((status, i) => {
                const isClickable =
                  onProposalSectionClick &&
                  (status === "good" || status === "suggestion");
                const icon = <QualityStatusIcon key={i} status={status} />;
                if (isClickable) {
                  return (
                    <button
                      key={i}
                      type="button"
                      className="cursor-pointer p-0 border-0 bg-transparent rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProposalSectionClick(project.id, i);
                      }}
                      aria-label={`Section ${i + 1} status: ${status}`}
                    >
                      {icon}
                    </button>
                  );
                }
                return icon;
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const project = row.original;
          const isOpen = openActionsRowId === project.id;
          return (
            <DropdownMenu
              open={isOpen}
              onOpenChange={(open) =>
                setOpenActionsRowId(open ? project.id : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                <DropdownMenuLabel
                  className="cursor-default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard.writeText(String(project.id));
                  }}
                >
                  Copy project ID
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenActionsRowId(null);
                    setProjectToDelete(project);
                  }}
                >
                  Delete project <Trash className="ml-2 h-4 w-4 text-red-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [
      queryClient,
      openActionsRowId,
      setOpenActionsRowId,
      setProjectToDelete,
      onProposalSectionClick,
    ],
  );

  const feedbackColumns = useMemo<ColumnDef<IFeedbackHistoryItem>[]>(
    () => [
      {
        id: "profile",
        header: "Profile",
        cell: ({ row }) => {
          const item = row.original;
          const userName = item.user_name || "Person name";
          const initials = getInitials(userName);
          return (
            <div className="flex items-center gap-3 min-w-48">
              <Avatar className="h-10 w-10 rounded-full">
                <AvatarFallback className="h-10 w-10 rounded-full text-[14px] leading-[20px] font-semibold text-[#181D27]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                  {userName}
                </span>
                <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                  {item.organization_name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "project",
        header: "Project",
        cell: ({ row }) => {
          const item = row.original;
          const project = projects.find((p) => p.id === item.project_id);
          const clientName = project?.client_name ?? item.project_name;
          const projectName = project?.name ?? item.project_name;
          return (
            <div className="flex flex-col items-start text-ellipsis overflow-hidden text-wrap">
              <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                {clientName}
              </span>
              <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                {projectName}
              </span>
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => {
          const item = row.original;
          const project = projects.find((p) => p.id === item.project_id);
          const submissionDeadline = project?.submission_deadline;
          const formattedDeadline =
            submissionDeadline &&
            dayjs(submissionDeadline).isValid() &&
            !String(submissionDeadline).startsWith("0000-")
              ? dayjs(submissionDeadline).format("MMM D, YYYY")
              : null;
          return (
            <div className="flex flex-col gap-1.5 text-[14px] leading-[20px]">
              {formattedDeadline && (
                <span
                  className="inline-flex w-fit rounded px-2 py-0.5 text-[14px] font-normal shrink-0"
                  style={{
                    backgroundColor: "#E0EDFF",
                    color: "#242E74",
                  }}
                >
                  Deadline: {formattedDeadline}
                </span>
              )}
              <span className="font-normal text-[#414651] text-ellipsis overflow-hidden text-wrap">
                {item.project_description}
              </span>
            </div>
          );
        },
      },
      {
        id: "quality",
        header: "Quality / Readiness",
        cell: ({ row }) => {
          const item = row.original;
          const sections = [...(item.sections ?? [])].sort(
            (a, b) => a.section_index - b.section_index,
          );
          return (
            <div className="flex flex-col gap-3">
              {sections.map((section) => {
                const isClickable =
                  onProposalSectionClick &&
                  (section.feedback_status === "good" ||
                    section.feedback_status === "suggestion");
                const icon = (
                  <QualityStatusIcon status={section.feedback_status} />
                );
                return (
                  <div
                    key={section.id}
                    className="flex flex-row gap-2 items-start min-w-0"
                  >
                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                      <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                        {section.section_title}
                      </span>
                      {section.comment && (
                        <span className="text-[14px] leading-[20px] font-normal text-[#414651] text-ellipsis overflow-hidden text-wrap">
                          {section.comment}
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      {isClickable ? (
                        <button
                          type="button"
                          className="cursor-pointer p-0 border-0 bg-transparent rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProposalSectionClick(
                              item.project_id,
                              section.section_index,
                            );
                          }}
                          aria-label={`${section.section_title} status: ${section.feedback_status}`}
                        >
                          {icon}
                        </button>
                      ) : (
                        icon
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const item = row.original;
          const rowKey = `${item.project_id}-${item.user_id}`;
          const isOpen = openActionsRowIdFeedback === rowKey;
          return (
            <DropdownMenu
              open={isOpen}
              onOpenChange={(open) =>
                setOpenActionsRowIdFeedback(open ? rowKey : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                <DropdownMenuLabel
                  className="cursor-default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard.writeText(String(item.project_id));
                  }}
                >
                  Copy project ID
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigator.clipboard.writeText(String(item.user_id));
                  }}
                >
                  Copy user ID
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-0" />
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenActionsRowIdFeedback(null);
                    setFeedbackToDelete(item);
                  }}
                >
                  Delete feedbacks{" "}
                  <Trash className="ml-2 h-4 w-4 text-red-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [projects, openActionsRowIdFeedback, onProposalSectionClick],
  );

  const productRequestColumns = useMemo<ColumnDef<IProductRequestResponse>[]>(
    () => [
      {
        id: "profile",
        header: "Profile",
        cell: ({ row }) => {
          const pr = row.original;
          const user = users.find((u) => u.id === pr.user_id);
          const userName = user?.name ?? `User #${pr.user_id}`;
          const orgName = user?.organization_name ?? "—";
          const initials = getInitials(userName);
          return (
            <div className="flex items-center gap-3 min-w-48">
              <Avatar className="h-10 w-10 rounded-full">
                <AvatarFallback className="h-10 w-10 rounded-full text-[14px] leading-[20px] font-semibold text-[#181D27]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                  {userName}
                </span>
                <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                  {orgName}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        id: "product",
        header: "Product",
        cell: ({ row }) => {
          const pr = row.original;
          return (
            <div className="flex flex-col items-start text-ellipsis overflow-hidden text-wrap">
              <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
                {pr.category ?? "—"}
              </span>
              <span className="text-[14px] leading-[20px] font-bold text-[#181D27]">
                {pr.name}
              </span>
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="text-[14px] leading-[20px] font-normal text-[#414651] text-ellipsis overflow-hidden text-wrap block max-w-[200px]">
            {row.original.description ?? "—"}
          </span>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: ({ row }) => {
          const created = row.original.created_at;
          const formatted =
            created && dayjs(created).isValid()
              ? dayjs(created).format("MMM D, YYYY")
              : "—";
          return (
            <span className="text-[14px] leading-[20px] font-normal text-[#414651]">
              {formatted}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const style = productRequestStatusStyles[status];
          const Icon = style.icon;
          return (
            <span
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[14px] leading-[20px] font-medium border"
              style={{
                backgroundColor: style.bg,
                borderColor: style.border,
                color: style.color,
              }}
            >
              <Icon
                className="h-4 w-4 shrink-0"
                style={{ color: style.color }}
              />
              {style.label}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const pr = row.original;
          const isOpen = openActionsRowIdProductRequest === pr.id;
          return (
            <DropdownMenu
              open={isOpen}
              onOpenChange={(open) =>
                setOpenActionsRowIdProductRequest(open ? pr.id : null)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(event) => event.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="p-0">
                <DropdownMenuItem
                  className="text-[#3744A6]"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenActionsRowIdProductRequest(null);
                    setProductRequestToDelete(pr);
                  }}
                >
                  Delete <Trash className="ml-2 h-4 w-4 text-red-400" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [users, openActionsRowIdProductRequest],
  );

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setIsDeleting(true);
      await deleteProject(String(projectToDelete.id));
      const cachedProjects = queryClient.getQueryData<ProjectResponse[]>([
        EQueryKey.PROJECTS,
      ]);
      if (cachedProjects) {
        queryClient.setQueryData(
          [EQueryKey.PROJECTS],
          cachedProjects.filter((item) => item.id !== projectToDelete.id),
        );
      }
      setProjectToDelete(null);
      toast.success("Project deleted");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeletingUser(true);
      await deleteUser(String(userToDelete.id));
      const cachedUsers = queryClient.getQueryData<IUserResponse[]>([
        EQueryKey.USERS,
      ]);
      if (cachedUsers) {
        queryClient.setQueryData(
          [EQueryKey.USERS],
          cachedUsers.filter((item) => item.id !== userToDelete.id),
        );
      }
      setUserToDelete(null);
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleConfirmDeleteFeedback = async () => {
    if (!feedbackToDelete) return;
    const projectId = String(feedbackToDelete.project_id);
    const sections = feedbackToDelete.sections ?? [];
    try {
      setIsDeletingFeedback(true);
      for (const section of sections) {
        await deleteFeedback(projectId, section.id);
      }
      await queryClient.invalidateQueries({
        queryKey: [EQueryKey.FEEDBACK_HISTORY],
      });
      setFeedbackToDelete(null);
      toast.success("Feedback deleted");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsDeletingFeedback(false);
    }
  };

  const handleConfirmDeleteProductRequest = async () => {
    if (!productRequestToDelete) return;
    try {
      setIsDeletingProductRequest(true);
      await deleteProductRequest(productRequestToDelete.id);
      await queryClient.invalidateQueries({
        queryKey: [EQueryKey.PRODUCT_REQUESTS],
      });
      setProductRequestToDelete(null);
      toast.success("Product request deleted");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsDeletingProductRequest(false);
    }
  };

  const handleCreateProductRequest = async (
    data: Parameters<typeof createProductRequest>[0],
  ) => {
    try {
      setIsCreatingProductRequest(true);
      await createProductRequest(data);
      await queryClient.invalidateQueries({
        queryKey: [EQueryKey.PRODUCT_REQUESTS],
      });
      toast.success("Product request created");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsCreatingProductRequest(false);
    }
  };

  const handleCreateUser = async (data: Parameters<typeof createUser>[0]) => {
    try {
      setIsCreatingUser(true);
      await createUser(data);
      await queryClient.invalidateQueries({ queryKey: [EQueryKey.USERS] });
      toast.success("User created");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (
    userId: number,
    data: Parameters<typeof updateUser>[1],
  ) => {
    try {
      setIsCreatingUser(true);
      await updateUser(String(userId), data);
      await queryClient.invalidateQueries({ queryKey: [EQueryKey.USERS] });
      toast.success("User updated");
    } catch {
      toast.error("An error occurred. Please try again");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleCreateUserSidebarOpenChange = (open: boolean) => {
    setCreateUserSidebarOpen(open);
    if (!open) setUserToEdit(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <DeleteProjectModal
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        projectName={projectToDelete?.name ?? ""}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
      <DeleteUserModal
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
        userName={userToDelete?.name ?? ""}
        onConfirm={handleConfirmDeleteUser}
        isDeleting={isDeletingUser}
      />
      <DeleteFeedbackModal
        open={!!feedbackToDelete}
        onOpenChange={(open) => !open && setFeedbackToDelete(null)}
        description={
          feedbackToDelete ? (
            <>
              Are you sure you want to delete feedbacks from{" "}
              <span className="font-medium text-foreground">
                {feedbackToDelete.user_name}
              </span>{" "}
              for project "
              <span className="font-medium text-foreground">
                {feedbackToDelete.project_name}
              </span>
              "?
            </>
          ) : (
            ""
          )
        }
        onConfirm={handleConfirmDeleteFeedback}
        isDeleting={isDeletingFeedback}
      />
      <DeleteProductRequestModal
        open={!!productRequestToDelete}
        onOpenChange={(open) => !open && setProductRequestToDelete(null)}
        productName={productRequestToDelete?.name ?? ""}
        onConfirm={handleConfirmDeleteProductRequest}
        isDeleting={isDeletingProductRequest}
      />
      <CreateProductRequestSidebar
        open={createProductRequestSidebarOpen}
        onOpenChange={setCreateProductRequestSidebarOpen}
        onSubmit={handleCreateProductRequest}
        isSubmitting={isCreatingProductRequest}
      />
      <CreateUserSidebar
        open={createUserSidebarOpen}
        onOpenChange={handleCreateUserSidebarOpenChange}
        organizations={organizationOptions}
        user={userToEdit}
        onSubmit={handleCreateUser}
        onUpdate={handleUpdateUser}
        isSubmitting={isCreatingUser}
      />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-black">Dashboard</h1>
        {activeTab === "users" && (
          <Button
            size="sm"
            variant="default"
            onClick={() => setCreateUserSidebarOpen(true)}
          >
            + Add User
          </Button>
        )}
        {activeTab === "product-requests" && (
          <Button
            size="sm"
            variant="default"
            onClick={() => setCreateProductRequestSidebarOpen(true)}
          >
            + Add Product
          </Button>
        )}
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setSearch("");
        }}
        className="w-full"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="order-2 flex flex-wrap items-center gap-3 md:order-2">
            <div className="relative min-w-0 flex-1 md:max-w-[400px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9AA0A6]" />
              <Input
                placeholder="Search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full bg-white pl-9"
              />
            </div>
            <Select value={organization} onValueChange={setOrganization}>
              <SelectTrigger className="w-full bg-white sm:w-56">
                <SelectValue placeholder="Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Organizations</SelectItem>
                {filterOrganizationOptions.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TabsList className="order-1 w-fit bg-transparent md:order-1">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            {canAccessAdminTabs && (
              <>
                <TabsTrigger
                  value="users"
                  className="border-l-1 border-r-1 border-l-primary border-r-primary"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger
                  value="feedback"
                  className="border-r-1 border-r-primary"
                >
                  Feedback
                </TabsTrigger>
                <TabsTrigger value="product-requests">
                  Product Requests
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>
        <TabsContent value="projects">
          <div className="mt-4 [&_th]:!px-6 [&_th]:!py-3 [&_th]:!h-auto [&_th]:text-[12px] [&_th]:leading-[18px] [&_th]:font-semibold [&_th]:text-[#717680] [&_td]:!px-6 [&_td]:!py-4">
            <DataTable
              columns={columns}
              data={filteredProjects}
              onRowClick={onRowClick}
            />
          </div>
        </TabsContent>
        {canAccessAdminTabs && (
          <TabsContent value="users">
            <div className="mt-4 [&_th]:!px-6 [&_th]:!py-3 [&_th]:!h-auto [&_th]:text-[12px] [&_th]:leading-[18px] [&_th]:font-semibold [&_th]:text-[#717680] [&_td]:!px-6 [&_td]:!py-4">
              {usersLoading ? (
                <div className="py-8 text-center text-[#717680]">
                  Loading...
                </div>
              ) : (
                <DataTable columns={userColumns} data={filteredUsers} />
              )}
            </div>
          </TabsContent>
        )}
        {canAccessAdminTabs && (
          <TabsContent value="product-requests">
            <div className="mt-4 [&_th]:!px-6 [&_th]:!py-3 [&_th]:!h-auto [&_th]:text-[12px] [&_th]:leading-[18px] [&_th]:font-semibold [&_th]:text-[#717680] [&_td]:!px-6 [&_td]:!py-4">
              {productRequestsLoading ? (
                <div className="py-8 text-center text-[#717680]">
                  Loading...
                </div>
              ) : (
                <DataTable
                  columns={productRequestColumns}
                  data={filteredProductRequests}
                />
              )}
            </div>
          </TabsContent>
        )}
        {canAccessAdminTabs && (
          <TabsContent value="feedback">
            <div className="mt-4 [&_th]:!px-6 [&_th]:!py-3 [&_th]:!h-auto [&_th]:text-[12px] [&_th]:leading-[18px] [&_th]:font-semibold [&_th]:text-[#717680] [&_td]:!px-6 [&_td]:!py-4">
              {feedbackLoading ? (
                <div className="py-8 text-center text-[#717680]">
                  Loading...
                </div>
              ) : (
                <DataTable
                  columns={feedbackColumns}
                  data={filteredFeedbackHistory}
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProjectsView;
