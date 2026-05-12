# Template — feature folder

A "feature" in this codebase is a vertical slice that contains a form schema, the UI for the form (often a `Sheet` / `Sidebar`), and a barrel export. They live under `app/features/<feature-name>/`.

The two existing examples are:

- `app/features/add-user/`
- `app/features/add-product/`

Use them as references when you copy this template.

## Folder layout

```
app/features/<your-feature>/
├── schema.ts                    ← zod schemas + inferred types
├── <feature>-sidebar.tsx        ← the UI (Sheet/Dialog with the form)
└── index.ts                     ← barrel: re-export the public surface
```

If your feature also has a list view, add `<feature>-list.tsx`. If it has a table cell renderer, add `<feature>-cell.tsx`. Keep small files focused.

## `schema.ts`

```ts
import { z } from "zod";

const safeText = /^[a-zA-Z0-9\s\-_.@]+$/;

export const createXyzSchema = z.object({
  name: z
    .string()
    .min(1, "Required")
    .regex(safeText, "Only Latin letters, digits, spaces, - _ . @"),
  description: z.string().optional(),
});

export type CreateXyzFormValues = z.infer<typeof createXyzSchema>;

export const updateXyzSchema = createXyzSchema.partial();
export type UpdateXyzFormValues = z.infer<typeof updateXyzSchema>;
```

## `<feature>-sidebar.tsx` (high-level structure)

```ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "~/components/ui/sheet";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  createXyzSchema, type CreateXyzFormValues,
} from "~/features/add-xyz/schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateXyzFormValues) => void | Promise<void>;
};

export function CreateXyzSidebar({ open, onOpenChange, onSubmit }: Props) {
  const form = useForm<CreateXyzFormValues>({
    resolver: zodResolver(createXyzSchema),
    defaultValues: { name: "", description: "" },
    mode: "onBlur",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create Xyz</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4 mt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Xyz name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="self-end">
              Create
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

## `index.ts` (barrel)

```ts
export { CreateXyzSidebar } from "~/features/add-xyz/<feature>-sidebar";
export {
  createXyzSchema,
  updateXyzSchema,
  type CreateXyzFormValues,
  type UpdateXyzFormValues,
} from "~/features/add-xyz/schema";
```

## Where the API call lives

The API call **does not live in the feature folder.** It lives in `app/api/<area>.ts` (see `examples/api-client-template.ts`). The feature's `onSubmit` should look something like:

```ts
const { mutate: createXyz, isPending } = useMutation({
  mutationFn: (values: CreateXyzFormValues) => apiCreateXyz(values),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [EQueryKey.XYZ_LIST] });
    onOpenChange(false);
  },
});
```

Keep the feature folder UI-only. The data layer stays in `api/` and the cache lives in TanStack Query.
