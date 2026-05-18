import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SendHorizontal } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import ProjectsView from "~/components/ui/projectsTable";
import { Textarea } from "~/components/ui/textarea";
import { demoProjectHistoryRows } from "~/features/hardware/adapter";

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
  const routeByProjectId = useMemo(
    () => new Map(demoProjectHistoryRows.map((project) => [project.id, project.routePath])),
    [],
  );

  function onSubmit() {
    // Demo entry mode: create flow is intentionally disabled.
  }

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
                          disabled
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
                    <Button
                      variant="ghost"
                      type="button"
                      disabled
                      className="bg-[#EEF3F9] rounded-none justify-center px-5 py-3 w-32 items-center disabled:opacity-70"
                    >
                      <Plus /> Upload RFP
                    </Button>
                  </div>
                  {/* <Button
                    type="submit"
                    disabled
                    className="w-fit self-start"
                  >
                    Create <SendHorizontal className="ml-2 h-4 w-4" />
                  </Button> */}
                </div>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
      <div className="container mx-auto py-10 min-w-full">
        <ProjectsView
          projects={demoProjectHistoryRows}
          hideProjectActions
          onRowClick={(row) => {
            const routePath = routeByProjectId.get(row.original.id);
            if (routePath) navigate(routePath);
          }}
        />
      </div>
    </div>
  );
}
