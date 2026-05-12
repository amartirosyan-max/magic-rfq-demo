import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Plus, SendHorizontal, X } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { createNewProject, getProjects } from "~/api/projects";
import FileDoc from "~/assets/filesIcons/file-doc.svg";
import FilePdf from "~/assets/filesIcons/file-pdf.svg";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import ProjectsView from "~/components/ui/projectsTable";
import { Textarea } from "~/components/ui/textarea";
import { EQueryKey } from "~/constants/queryKeys";

const getFileIcon = (fileName: string) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return FilePdf;
    case "doc":
    case "docx":
      return FileDoc;
    default:
      return FileDoc;
  }
};

const formSchema = z.object({
  newProjectDescription: z.string(),
});

export default function Page() {
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newProjectDescription: "",
    },
  });
  const watchedDescription = form.watch("newProjectDescription");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: [EQueryKey.PROJECTS],
    queryFn: getProjects,
  });

  const { mutate: createProject, isPending: isCreating } = useMutation({
    mutationFn: (rfp: string) => createNewProject(rfp, selectedFiles),
    onSuccess: (data) => {
      if (data) {
        navigate(`/projects/${data.id}`);
      }
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Submitting new project:", values);
    console.log("Selected files:", selectedFiles);
    createProject(values.newProjectDescription);
  }

  const isSubmitDisabled =
    !watchedDescription.trim() && selectedFiles.length === 0;

  return (
    <div className="flex flex-col gap-8 w-3/4 mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-center flex-1 text-black">
            Create New Project
          </CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="mb-0">
              <div className="flex flex-col gap-4 justify-end">
                <FormField
                  control={form.control}
                  name="newProjectDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Describe new deal"
                          rows={5}
                          className={`border p-2 resize-none w-full break-words max-h-32 overflow-y-auto text-black`}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-2.5">
                    {selectedFiles.filter(
                      (file) => !file?.name?.toLowerCase().endsWith(".md"),
                    ).length > 0 && (
                      <ul className="space-y-2">
                        {selectedFiles
                          .filter(
                            (file) =>
                              !file?.name?.toLowerCase().endsWith(".md"),
                          )
                          .map((file, index) => (
                            <li
                              key={index}
                              className="flex items-center justify-between text-sm p-2 bg-gray-50 w-fit gap-2.5"
                            >
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={getFileIcon(file.name)}
                                  alt="File Icon"
                                  className="h-5 w-5"
                                />
                                <span className="text-black">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFiles((prev) =>
                                    prev.filter((_, i) => i !== index),
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                      </ul>
                    )}
                    <Button
                      variant="ghost"
                      type="button"
                      className="bg-[#EEF3F9] rounded-none justify-center px-5 py-3 relative w-32 items-center"
                    >
                      <Plus /> Upload RFP
                      <Input
                        id="fileUpload"
                        type="file"
                        multiple
                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                        accept=".doc, .docx, .pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/pdf"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const newFiles = Array.from(e.target.files).filter(
                              (file) =>
                                !file?.name?.toLowerCase().endsWith(".md"),
                            );
                            setSelectedFiles((prev) => [...prev, ...newFiles]);
                          }
                        }}
                      />
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreating || isSubmitDisabled}
                    className="w-fit self-start"
                  >
                    {isCreating ? (
                      <>
                        Creating...{" "}
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      <>
                        Create <SendHorizontal className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
      <div className="container mx-auto py-10 min-w-full">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">{error.message}</div>
          </div>
        )}

        {!isLoading && !error && projects && (
          <ProjectsView
            projects={projects.sort((a, b) => b.id - a.id)}
            onRowClick={(row) => navigate(`/projects/${row.original.id}`)}
            onProposalSectionClick={(projectId, sectionIndex) =>
              navigate(
                `/projects/${projectId}?tab=proposal&section=${sectionIndex}`,
              )
            }
          />
        )}

        {/* {!isLoading && !error && projects && (
          <DataTable
            columns={columns}
            searchFilter
            data={projects.sort((a, b) => b.id - a.id)}
            onRowClick={(row) => navigate(`/projects/${row.original.id}`)}
          />
        )} */}
      </div>
    </div>
  );
}
