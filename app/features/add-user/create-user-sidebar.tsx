import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Mail } from "lucide-react";
import { useEffect } from "react";
import type { Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type {
  ICreateUserRequest,
  IUpdateUserRequest,
  IUserResponse,
} from "~/api/users";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserFormValues,
} from "~/features/add-user/schema";

export type OrganizationOption = { id: number; name: string };

const createDefaults: CreateUserFormValues = {
  organization_id: "",
  division: "",
  location: "",
  name: "",
  email: "",
  login: "",
  password: "",
};

type CreateUserSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: OrganizationOption[];
  user?: IUserResponse | null;
  onSubmit: (data: ICreateUserRequest) => void | Promise<void>;
  onUpdate?: (userId: number, data: IUpdateUserRequest) => void | Promise<void>;
  isSubmitting?: boolean;
};

export function CreateUserSidebar({
  open,
  onOpenChange,
  organizations,
  user: editingUser,
  onSubmit,
  onUpdate,
  isSubmitting = false,
}: CreateUserSidebarProps) {
  const isEditMode = !!editingUser;

  const form = useForm<CreateUserFormValues>({
    resolver: ((values, context, options) =>
      (isEditMode
        ? zodResolver(updateUserSchema)
        : zodResolver(createUserSchema))(
        values,
        context,
        options,
      )) as Resolver<CreateUserFormValues>,
    defaultValues: createDefaults,
  });

  useEffect(() => {
    if (!open) return;
    if (editingUser) {
      form.reset({
        organization_id: String(editingUser.organization_id),
        division: editingUser.division ?? "",
        location: editingUser.location ?? "",
        name: editingUser.name,
        email: editingUser.email,
        login: editingUser.login,
        password: "",
      });
    } else {
      form.reset(createDefaults);
    }
  }, [open, editingUser?.id]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onFormSubmit = async (values: CreateUserFormValues) => {
    const orgId = Number(values.organization_id);
    const selectedOrg = organizations.find((o) => o.id === orgId);
    const organization_id = selectedOrg?.id ?? orgId;

    if (isEditMode && editingUser && onUpdate) {
      const payload: IUpdateUserRequest = {
        name: values.name,
        email: values.email,
        login: values.login,
        division: values.division || undefined,
        location: values.location || undefined,
        organization_id,
      };
      if (values.password?.trim()) payload.password = values.password.trim();
      await onUpdate(editingUser.id, payload);
    } else {
      await onSubmit({
        organization_id,
        name: values.name,
        email: values.email,
        login: values.login,
        password: values.password,
        division: values.division || undefined,
        location: values.location || undefined,
      });
    }
    handleClose();
  };

  const dash = (v: string | undefined) => (v?.trim() ? v.trim() : "—");

  const handleCopy = () => {
    const values = form.getValues();
    const url = "https://magic.mindware.net";
    const login = dash(values.login);
    const password = dash(values.password);
    const instructionsLink = "—";
    const managerName = "—";

    const text = `Your login details:
• URL: ${url}
• Login: ${login}
• Password: ${password}

Sign-in instructions:
1. Follow the link and sign in to the system.
2. Use the username and password provided above.
3. Detailed instructions are available here: ${instructionsLink}.

Your personal manager: ${managerName}.`;

    void navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied");
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md bg-[#fff]"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
          <SheetTitle>{isEditMode ? "Update User" : "Create User"}</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            id="create-user-form"
            onSubmit={form.handleSubmit(onFormSubmit)}
            className="flex flex-1 flex-col overflow-y-auto px-3 py-2 pb-4"
          >
            <div className="flex flex-col gap-4 py-2">
              <FormField
                control={form.control}
                name="organization_id"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Organizations</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full" disabled={isEditMode}>
                          <SelectValue placeholder="Organizations" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={String(org.id)}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="division"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Division</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Division" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter Location" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="example@companyname.com"
                          className="pl-9"
                          error={!!form.formState.errors.email}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Login</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          isEditMode
                            ? "Leave blank to keep unchanged"
                            : undefined
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <div className="mt-auto">
          <Separator />
        </div>
        <div className="flex gap-3 px-3 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-[#3744A6] bg-white text-[#3744A6] hover:bg-[#3744A6]/5 hover:text-[#3744A6]"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="border-[#3744A6] bg-white text-[#3744A6] hover:bg-[#3744A6]/5 hover:text-[#3744A6]"
          >
            <Copy className="h-4 w-4" />
            Copy
          </Button>
          <Button
            type="submit"
            form="create-user-form"
            className="flex-1 bg-[#3744A6] text-white hover:bg-[#3744A6]/90"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditMode
                ? "Updating…"
                : "Creating…"
              : isEditMode
                ? "Update"
                : "Create"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
