import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle, Loader2, Paperclip, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { ICreateProductRequestForm } from "~/api/productRequests";
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
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Textarea } from "~/components/ui/textarea";
import {
  createProductRequestSchema,
  type CreateProductRequestFormValues,
} from "~/features/add-product/schema";

const defaultValues: CreateProductRequestFormValues = {
  name: "",
  category: "",
  description: "",
  cost: "",
  comments: "",
};

const uploadButtonClass =
  "w-full bg-[#EEF3F9] rounded-none px-5 py-3 text-primary h-10 justify-center gap-2";

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileCardClass =
  "flex items-center justify-between gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100 w-full text-left";

const fieldErrorMessageClass = "text-sm text-destructive pt-1";

function FileCard({
  name,
  size,
  onDelete,
}: {
  name: string;
  size?: string;
  onDelete?: () => void;
}) {
  return (
    <div className={fileCardClass}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded bg-gray-200/80">
          <Paperclip className="h-5 w-5 text-gray-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            {size && <span>{size}</span>}
            {size && <span className="text-gray-300 select-none">|</span>}
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              100%
            </span>
          </div>
        </div>
      </div>
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-gray-400 hover:bg-transparent"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

type CreateProductRequestSidebarProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ICreateProductRequestForm) => void | Promise<void>;
  isSubmitting?: boolean;
};

export function CreateProductRequestSidebar({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
}: CreateProductRequestSidebarProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [imageValidationError, setImageValidationError] = useState<
    string | null
  >(null);
  const [fileCountValidationError, setFileCountValidationError] = useState<
    string | null
  >(null);

  const form = useForm<CreateProductRequestFormValues>({
    resolver: zodResolver(createProductRequestSchema),
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
    setImageFile(null);
    setExtraFiles([]);
    setImageValidationError(null);
    setFileCountValidationError(null);
  }, [open]);

  const handleClose = () => {
    form.reset(defaultValues);
    setImageFile(null);
    setExtraFiles([]);
    setImageValidationError(null);
    setFileCountValidationError(null);
    onOpenChange(false);
  };

  const onFormSubmit = async (values: CreateProductRequestFormValues) => {
    if (!imageFile || extraFiles.length < 1) return;
    const payload: ICreateProductRequestForm = {
      name: values.name.trim(),
      category: values.category?.trim() || undefined,
      description: values.description?.trim() || undefined,
      cost: values.cost?.trim() || undefined,
      comments: values.comments?.trim() || undefined,
      image: imageFile ?? undefined,
      files: extraFiles.length > 0 ? extraFiles : undefined,
    };
    await onSubmit(payload);
    handleClose();
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      form.reset(defaultValues);
      setImageFile(null);
      setExtraFiles([]);
      setImageValidationError(null);
      setFileCountValidationError(null);
    }
    onOpenChange(next);
  };

  const handleSubmitClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setImageValidationError(!imageFile ? "File is required" : null);
    setFileCountValidationError(
      extraFiles.length < 1 ? "At least one file is required" : null,
    );
    void form.handleSubmit(onFormSubmit)(e);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-md bg-[#fff]"
      >
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4">
          <SheetTitle>Add Product</SheetTitle>
        </SheetHeader>
        <Form {...form}>
          <form
            id="product-request-form"
            onSubmit={handleSubmitClick}
            className="flex flex-1 flex-col overflow-y-auto px-3 py-2 pb-4"
          >
            <div className="flex flex-col gap-4 py-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="px-3 py-2 space-y-2">
                <FormLabel
                  className={imageValidationError ? "text-destructive" : ""}
                >
                  Product Image
                </FormLabel>
                <Button
                  type="button"
                  variant="ghost"
                  className={uploadButtonClass}
                  asChild
                >
                  <label className="cursor-pointer flex items-center justify-center gap-2 w-full">
                    <Upload className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setImageFile(f);
                          setImageValidationError(null);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                </Button>
                {imageFile && (
                  <FileCard
                    name={imageFile.name}
                    size={formatFileSize(imageFile.size)}
                    onDelete={() => setImageFile(null)}
                  />
                )}
                {imageValidationError && (
                  <p className={fieldErrorMessageClass}>
                    {imageValidationError}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description"
                        rows={3}
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Cost</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="$"
                        inputMode="decimal"
                        {...field}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^\d.]/g, "");
                          const parts = v.split(".");
                          if (parts.length > 2) return;
                          if (parts[1]?.length > 2) return;
                          field.onChange(v);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="px-3 py-2 space-y-2">
                <FormLabel
                  className={fileCountValidationError ? "text-destructive" : ""}
                >
                  File
                </FormLabel>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className={uploadButtonClass}
                    asChild
                  >
                    <label className="cursor-pointer flex items-center justify-center gap-2 w-full">
                      <Upload className="h-4 w-4" />
                      Upload
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const list = e.target.files;
                          if (list?.length) {
                            setExtraFiles((prev) => [
                              ...prev,
                              ...Array.from(list),
                            ]);
                            setFileCountValidationError(null);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </Button>
                </div>
                {extraFiles.length > 0 && (
                  <ul className="space-y-2 mt-3">
                    {extraFiles.map((f, i) => (
                      <FileCard
                        key={`new-${i}`}
                        name={f.name}
                        size={formatFileSize(f.size)}
                        onDelete={() => {
                          const next = extraFiles.filter((_, j) => j !== i);
                          setExtraFiles(next);
                          if (next.length === 0)
                            setFileCountValidationError(
                              "At least one file is required",
                            );
                          else setFileCountValidationError(null);
                        }}
                      />
                    ))}
                  </ul>
                )}
                {fileCountValidationError && (
                  <p className={fieldErrorMessageClass}>
                    {fileCountValidationError}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem className="px-3 py-2">
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Comments"
                        rows={3}
                        className="resize-none"
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
        <div className="flex gap-3 px-3 py-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="border-[#3744A6] bg-white text-[#3744A6] hover:bg-[#3744A6]/5 hover:text-[#3744A6]"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="product-request-form"
            className="w-fit bg-[#3744A6] text-white hover:bg-[#3744A6]/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {" Creating…"}
              </>
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
